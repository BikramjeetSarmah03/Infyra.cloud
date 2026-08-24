# Neon — Provider Integration

Serverless Postgres. First `DatabaseAdapter` implementation and the first OAuth provider — per [tasks.md](../tasks.md), it proves both the second auth type and the second category at once.

---

## 1. At a Glance

| | |
|---|---|
| **Base URL** | `https://console.neon.tech/api/v2` |
| **Auth type** | `oauth` (OAuth 2.0 + PKCE) — also supports API keys, see §6.1 |
| **Category** | `database` |
| **Adapter interface** | `DatabaseAdapter extends ProviderAdapter` |
| **Auth header** | `Authorization: Bearer <access_token>` |
| **OpenAPI spec** | `https://neon.com/api_spec/release/v2.json` |
| **Partner approval needed** | **Yes** — OAuth app must be registered with Neon before `getAuthUrl()` works |

> **Blocking external dependency.** Per [modules/provider-connections.md](../modules/provider-connections.md), the OAuth app registration is not code and its turnaround is outside engineering's control. Kick this off before the adapter is scheduled, not when it's started. See §6.1 for the interim path.

---

## 2. Authentication — OAuth 2.0 + PKCE

Neon's OAuth server is a standard OIDC provider, separate from the API host.

| Endpoint | URL |
|---|---|
| Discovery | `https://oauth2.neon.tech/.well-known/openid-configuration` |
| Authorize | `https://oauth2.neon.tech/oauth2/auth` |
| Token | `https://oauth2.neon.tech/oauth2/token` |

**Because a discovery document exists, do not hardcode the authorize and token URLs.** Fetch and cache the discovery document at adapter init. This is the one provider in the set that gives us endpoint rotation for free.

### 2.1 Authorize request (`getAuthUrl(state)`)

```
GET https://oauth2.neon.tech/oauth2/auth
  ?client_id=<INFYRA_NEON_CLIENT_ID>
  &redirect_uri=https://api.infyra.cloud/connections/neon/callback
  &response_type=code
  &scope=openid offline offline_access project:create project:read project:update project:delete
  &state=<opaque, single-use, workspace-bound>
  &code_challenge=<BASE64URL(SHA256(verifier))>
  &code_challenge_method=S256
```

| Parameter | Required | Notes |
|---|---|---|
| `client_id` | Yes | From `packages/env` |
| `redirect_uri` | Yes | Must exactly match the registered value |
| `response_type` | Yes | `code` |
| `scope` | Yes | See §2.2 — **`offline` + `offline_access` are mandatory for refresh tokens** |
| `state` | Yes | CSRF defense + carries workspace context; see §6.2 |
| `code_challenge` | Yes | PKCE. Neon accepts `plain` and `S256` — **always use `S256`** |
| `code_challenge_method` | Yes | `S256` |

### 2.2 Scopes

Neon offers two predefined scope families; **custom scopes are not supported**, so request the narrowest predefined set that covers the operations in §4.

| Scope | Needed for |
|---|---|
| `openid` | Identity of the connecting user |
| `offline`, `offline_access` | **Refresh tokens — both required.** Omitting either yields an access-token-only grant |
| `project:create` | `createDatabase()` |
| `project:read` | `listResources()`, `checkHealth()`, `getUsage()` |
| `project:update` | `createBranch()` |
| `project:delete` | `deleteResource()` |
| `org:read` / `org:*` | Only if org-scoped connections are supported (defer — see §6.5) |

> The double `offline` + `offline_access` requirement is the single most likely thing to get wrong here. Without a refresh token, every Neon connection silently degrades to `needs_reauth` at first token expiry, and it will look like a token-expiry bug rather than a scope bug.

### 2.3 Token exchange (`exchangeCode(code)`)

```
POST https://oauth2.neon.tech/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<code>
&redirect_uri=<same as authorize>
&client_id=<...>
&client_secret=<...>
&code_verifier=<the original PKCE verifier>
```

Persist from the response: `access_token`, `refresh_token`, `expires_in` (→ absolute `expiresAt`), `scope`.

**Store `scope` from the response, not the scope you requested.** A grant can come back narrower than asked; storing the request would make capability checks lie.

---

## 3. Token Lifetime & Refresh

**Neon does not publish access-token or refresh-token TTLs.** Do not hardcode a guess.

Consequences for the adapter:

1. **Drive expiry from `expires_in` on every token response** — both initial exchange and refresh. Store an absolute timestamp, never a duration.
2. **Refresh proactively at 75% of the observed lifetime**, per [adapter-design.md](../adapter-design.md) §3.4 — expressed as a fraction, not a fixed offset, precisely because the TTL is unknown and may change.
3. **Assume refresh-token rotation.** If a refresh response includes a new `refresh_token`, replace the stored one atomically. Do not assume the old one stays valid.
4. **Read the discovery document's TTL hints at init** if present, but still let `expires_in` win.

```
POST https://oauth2.neon.tech/oauth2/token
grant_type=refresh_token&refresh_token=<...>&client_id=<...>&client_secret=<...>
```

### Refresh failure → status

| Outcome | Status |
|---|---|
| `invalid_grant` | `revoked` — user de-authorized infyra at Neon |
| `invalid_client` | `invalid` — **infyra's** config is broken, not the user's. Alert internally; do not tell the agency to reconnect |
| 429 / 5xx | No status change; retry with backoff |

That `invalid_client` row matters: it's the one failure mode where the correct action is paging the infyra team, and where a "please reconnect" message to every affected agency at once would be actively wrong.

---

## 4. Core Endpoints → Adapter Methods

All paths relative to `https://console.neon.tech/api/v2`.

| Adapter method | HTTP | Path |
|---|---|---|
| `checkHealth()` | `GET` | `/users/me` |
| `listResources()` | `GET` | `/projects` |
| `createDatabase()` | `POST` | `/projects` |
| `deleteResource()` | `DELETE` | `/projects/{project_id}` |
| `createBranch()` | `POST` | `/projects/{project_id}/branches` |
| — list databases | `GET` | `/projects/{project_id}/branches/{branch_id}/databases` |
| `getConnectionString()` | `GET` | `/projects/{project_id}/connection_uri` |
| `getUsage()` | `GET` | `/consumption_history/v2/projects` |
| — per-branch usage | `GET` | `/consumption_history/v2/branches` |

### 4.1 `createDatabase()` — request shape

```jsonc
POST /projects
{
  "project": {
    "name": "infyra-<workspace-slug>-<project-slug>",
    "region_id": "aws-us-east-1",     // see §6.3
    "pg_version": 17
  }
}
```

**Naming is load-bearing.** Because Neon has no idempotency key (§6.4), the project name is the deduplication key. Derive it deterministically from workspace + project so a retried create is detectable.

### 4.2 `getConnectionString()` — returns a secret

`GET /projects/{project_id}/connection_uri` requires `database_name` and `role_name` query params and returns a URI **with the password embedded**.

Per [adapter-design.md](../adapter-design.md) §2, the adapter returns it and the caller decides what to do with it. Concretely:
- Never write the returned URI to the `resources.metadata` JSON.
- Never log it, including in error paths that dump the request context.
- When auto-injecting into a deploy provider's env vars ([product.md](../product.md) §6), it goes straight from this call into `setEnvVars()` without an intermediate persisted row.

### 4.3 Normalizing into `resources`

| `resources` column | Neon source |
|---|---|
| `provider_resource_id` | `project.id` |
| `type` | `database` |
| `status` | Derived — Neon projects have no single status field; see §6.6 |
| `metadata` | `{ branchId, region, pgVersion, computeSettings, autoscaling }` |

---

## 5. Rate Limits & Errors

**Neon does not publish rate limits.** Treat as unknown: respect `Retry-After` on 429, apply the conservative default bucket from [README.md](./README.md#rate-limits-at-a-glance).

| HTTP | Normalized error |
|---|---|
| 401 | `AdapterAuthError` (triggers refresh, then re-evaluate) |
| 403 | `AdapterAuthError` — insufficient scope |
| 404 | `AdapterNotFoundError` |
| 422 | `AdapterValidationError` |
| 429 | `AdapterRateLimitError` |
| 5xx | `AdapterUnknownError` |

---

## 6. Adapter Notes

### 6.1 API key as the interim path
Neon supports plain API keys (`Authorization: Bearer <NEON_API_KEY>`) against the same base URL and the same endpoints in §4. Since OAuth app approval is a blocking external dependency, **build the adapter's resource-operation half against an API key first**, then add the OAuth lifecycle methods when approval lands. The §4 endpoint table is identical for both — only §2/§3 change.

This is worth doing deliberately rather than as a hack: it unblocks all of Project & Resource Management's database half without waiting on Neon's partner turnaround. Model it as `authType: "api_key"` on a separate registry entry (`neon-api-key`) rather than a mutable flag on one adapter, so the two auth paths never share a code path they can drift on.

### 6.2 `state` must not be a bare workspace ID
It's returned to a public callback URL. Use an opaque, single-use, server-stored token that maps to `{ workspaceId, userId, pkceVerifier, expiresAt }`, TTL ~10 minutes. The PKCE verifier lives here — it must survive the redirect without going to the browser.

### 6.3 Region pinning is decided at create time and is permanent
`region_id` is set when the project is created and cannot be changed after. This directly answers [architecture.md](../architecture.md) open question #3: for Neon, **a project is region-pinned at creation, so workspace region preference must be resolved before `createDatabase()` is called, not after.** A wrong region means delete-and-recreate, which for a database with data is not a recoverable operation.

### 6.4 No idempotency key
Neon documents no idempotency key. Use the name-based pre-check from [README.md](./README.md#idempotency-support), keyed on the deterministic name from §4.1.

### 6.5 Org-scoped connections — defer
Neon supports organizations, and org scopes exist. But [product.md](../product.md) §4 already allows multiple connections per provider, which covers the "agency manages several Neon accounts" case without org scopes. Defer org support until an agency actually asks — adding org scopes later widens a grant, which requires re-consent from every connected user.

### 6.6 Projects have no single status field
Unlike Render services, a Neon project doesn't expose one status string to map. Derive `resources.status`:
- Project fetch succeeds → `active`
- 404 → `deleted` (deleted outside infyra — reconcile per [architecture.md](../architecture.md) §4)
- Compute suspended (autoscale-to-zero) → still `active`. **Suspended is normal, not degraded.** Neon scales computes to zero on idle by design; showing an agency "suspended" for a healthy free-tier database would generate support load for a non-problem.

---

## 7. Documentation Links

| Topic | URL |
|---|---|
| API reference | https://neon.com/docs/reference/api |
| OpenAPI spec | https://neon.com/api_spec/release/v2.json |
| OAuth integration guide | https://neon.com/docs/guides/oauth-integration |
| OIDC discovery | https://oauth2.neon.tech/.well-known/openid-configuration |
| Docs index for agents | https://api-docs.neon.tech/llms.txt |

> `api-docs.neon.tech` is deprecated and redirects to `neon.com/docs`. The `llms.txt` index above still resolves and is the fastest way to re-verify endpoints.
