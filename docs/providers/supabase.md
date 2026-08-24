# Supabase — Provider Integration

Postgres + auth + storage, exposed through the Management API. Second `DatabaseAdapter`, second OAuth provider.

Supabase's org → project hierarchy is the specific quirk [product.md](../product.md) §5 names as needing to stay inside its adapter. §6.2 is where that's handled.

---

## 1. At a Glance

| | |
|---|---|
| **Base URL** | `https://api.supabase.com/v1` |
| **Auth type** | `oauth` (OAuth 2.0 + PKCE) — also supports PATs, see §6.1 |
| **Category** | `database` |
| **Adapter interface** | `DatabaseAdapter extends ProviderAdapter` |
| **Auth header** | `Authorization: Bearer <access_token>` |
| **Rate limit** | **120 req/min** per user/scope; analytics + database endpoints **10–30 req/min** |
| **Partner approval needed** | Yes — OAuth app registered in Supabase dashboard |

Supabase is the only launch provider that publishes concrete rate limits, which makes it the reference implementation for the shared limiter (§5).

---

## 2. Authentication — OAuth 2.0 + PKCE

Unlike Neon, the OAuth endpoints live on the same host as the API, and **there is no discovery document** — these URLs are hardcoded.

| Endpoint | URL |
|---|---|
| Authorize | `https://api.supabase.com/v1/oauth/authorize` |
| Token | `POST https://api.supabase.com/v1/oauth/token` |

### 2.1 Authorize request (`getAuthUrl(state)`)

```
GET https://api.supabase.com/v1/oauth/authorize
  ?client_id=<INFYRA_SUPABASE_CLIENT_ID>
  &redirect_uri=https://api.infyra.cloud/connections/supabase/callback
  &response_type=code
  &state=<opaque, single-use, workspace-bound>
  &code_challenge=<BASE64URL(SHA256(verifier))>
  &code_challenge_method=S256
```

| Parameter | Required | Notes |
|---|---|---|
| `client_id` | Yes | From `packages/env` |
| `redirect_uri` | Yes | Exact match with registered value |
| `response_type` | Yes | `code` |
| `state` | Yes | Same opaque-token rule as [neon.md](./neon.md) §6.2 |
| `code_challenge` | Yes | PKCE strongly recommended by Supabase — treat as mandatory |
| `code_challenge_method` | Yes | `S256` |
| `organization_slug` | No | Pre-selects an org on the consent screen — see §6.2 |

**Scopes are not sent in the authorize request.** They're fixed when the OAuth app is registered in the Supabase dashboard. This is a meaningful difference from Neon: infyra cannot request narrower scopes per connection, and **widening scopes later means re-registering and re-consenting every existing connection.** Choose the app's scope set deliberately at registration time — over-requesting is a permanent posture, under-requesting is a migration.

### 2.2 Token exchange (`exchangeCode(code)`)

```
POST https://api.supabase.com/v1/oauth/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<code>
&redirect_uri=<same as authorize>
&code_verifier=<original PKCE verifier>
```

**Credentials go in the `Authorization: Basic` header, not the body** — this differs from Neon, which accepts them as body params. A shared OAuth helper across the two adapters must parameterize client-auth placement rather than assume one style.

---

## 3. Token Lifetime & Refresh

**Supabase does not publish access-token TTL or refresh-token rotation policy.** Same discipline as Neon:

1. Absolute `expiresAt` derived from `expires_in` on every response.
2. Proactive refresh at 75% of observed lifetime.
3. Assume rotation — replace the stored refresh token whenever a new one comes back.

```
POST https://api.supabase.com/v1/oauth/token
Authorization: Basic base64(client_id:client_secret)

grant_type=refresh_token&refresh_token=<...>
```

Supabase documents one thing explicitly worth encoding: **if the user has revoked access, refresh fails.** That's the revocation signal — map it to `revoked`, not `needs_reauth`, so the UI offers "reconnect" rather than a silent retry.

| Refresh outcome | Status |
|---|---|
| Success | `connected` |
| Fails, user revoked | `revoked` |
| Fails, token expired/rotated away | `needs_reauth` |
| 429 / 5xx | No status change |

---

## 4. Core Endpoints → Adapter Methods

All paths relative to `https://api.supabase.com/v1`.

| Adapter method | HTTP | Path |
|---|---|---|
| `checkHealth()` | `GET` | `/organizations` |
| — list orgs | `GET` | `/organizations` |
| `listResources()` | `GET` | `/projects` |
| `createDatabase()` | `POST` | `/projects` |
| — get project | `GET` | `/projects/{ref}` |
| `deleteResource()` | `DELETE` | `/projects/{ref}` |
| `getConnectionString()` | `GET` | `/projects/{ref}` + `/projects/{ref}/api-keys` |
| — API keys | `GET`/`POST` | `/projects/{ref}/api-keys` |
| `getUsage()` | `GET` | `/projects/{ref}/usage.*` |
| `createBranch()` | `POST` | `/projects/{ref}/branches` — see §6.3 |

`/organizations` is the health-check call: it's the cheapest authenticated endpoint that works even for an account with zero projects.

### 4.1 `createDatabase()` — request shape

```jsonc
POST /projects
{
  "name": "infyra-<workspace-slug>-<project-slug>",
  "organization_id": "<org id>",        // required — see §6.2
  "region": "us-east-1",
  "db_pass": "<generated, high-entropy>",
  "plan": "free"
}
```

Two things to get right:

- **`organization_id` is required.** There is no "default org" fallback. §6.2.
- **`db_pass` is generated by infyra and shown once.** Supabase does not return it later. Generate high-entropy, hand it to `setEnvVars()` if auto-injecting, and never persist it to `metadata`. If it's lost, the recovery path is a password reset on the project, not a lookup.

### 4.2 `getConnectionString()` takes two calls
Unlike Neon's single `connection_uri` endpoint, Supabase requires composing the host/port from `GET /projects/{ref}` with the password from create-time (§4.1). Encapsulate this inside the adapter — the composition rule is exactly the kind of provider quirk that must not leak into calling code.

### 4.3 Normalizing into `resources`

| `resources` column | Supabase source |
|---|---|
| `provider_resource_id` | `project.ref` (the project ref string, not a UUID) |
| `type` | `database` |
| `status` | Mapped from `project.status` (`ACTIVE_HEALTHY`, `INACTIVE`, `COMING_UP`, …) |
| `metadata` | `{ organizationId, region, plan, dbHost, dbPort, postgresVersion }` |

`organizationId` in `metadata` is required — §6.2 needs it for routing.

---

## 5. Rate Limits & Errors

Supabase publishes real numbers, so the limiter can be configured rather than guessed:

| Endpoint class | Limit |
|---|---|
| General Management API | 120 req/min per user/scope |
| Analytics + database endpoints | 10–30 req/min |

Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

**The 10–30 req/min tier is the constraint that actually bites.** `getUsage()` is in that tier and Observability ([product.md](../product.md) §8) calls it per project on a schedule. An agency with 40 Supabase projects cannot have usage refreshed per-project-per-minute — usage aggregation must be batched and staggered, and the refresh interval derived from project count, not fixed. This is the concrete form of [architecture.md](../architecture.md) open question #4 for this provider.

| HTTP | Normalized error |
|---|---|
| 401 | `AdapterAuthError` (refresh, re-evaluate) |
| 403 | `AdapterAuthError` — scope insufficient (not fixable per-connection, §2.1) |
| 404 | `AdapterNotFoundError` |
| 400/422 | `AdapterValidationError` |
| 429 | `AdapterRateLimitError` — carry `X-RateLimit-Reset` into the error |
| 5xx | `AdapterUnknownError` |

`AdapterRateLimitError` should carry the reset timestamp so the job runner can schedule rather than blind-backoff. Supabase is the provider that makes this worth building.

---

## 6. Adapter Notes

### 6.1 PAT as the interim path
Supabase supports Personal Access Tokens with user-set expiry, same header, same endpoints. As with [neon.md](./neon.md) §6.1, build resource operations against a PAT while OAuth app approval is pending, as a separate registry entry (`supabase-pat`) rather than a flag.

Note the difference from Render's key: **PATs have a custom expiry**, so a PAT connection *can* reach `needs_reauth` on its own. Don't assume `api_key` implies "never expires" in shared code — that assumption holds for Render and not here.

### 6.2 The org hierarchy is the main quirk
Supabase projects live under organizations; a user may belong to several. Two consequences:

1. **`createDatabase()` cannot proceed without an org.** If the user has multiple, infyra must ask which one at connect time and store it — mirroring the Render `ownerId` selection in [render.md](./render.md) §6.2. Same problem, same shape of solution.
2. **`listResources()` returns projects across all orgs the grant covers.** If the agency selected one org, the adapter filters to it — otherwise the dashboard shows the connecting user's personal side projects alongside client work.

The `organization_slug` authorize param (§2.1) helps but doesn't replace this: it pre-selects on the consent screen, it doesn't constrain the resulting grant.

### 6.3 Branching exists but is not Neon's branching
Supabase has database branching, but it's tied to Git integration and preview deploys rather than Neon's arbitrary point-in-time branches. **Do not map both onto one `createBranch()` semantic.** For V1, throw `NotSupportedError` for Supabase branching and revisit deliberately — a shared method whose behavior differs fundamentally per provider is worse than an explicit unsupported.

This is the anti-pattern in [adapter-design.md](../adapter-design.md) §7 seen from the other direction: not a provider field leaking into shared types, but two different provider concepts being forced into one shared method name.

### 6.4 No idempotency key
Name-based pre-check, scoped to the org — names are unique per org, not globally.

### 6.5 Project creation is slow and asynchronous
`POST /projects` returns before the database is usable (`COMING_UP` for a while). The adapter must not return a resource marked ready. Write the row with the provider's real status and let the reconciliation path flip it to `active` — [architecture.md](../architecture.md) §4's "no simulated state" rule applies directly here.

Practically: auto-injecting a connection string into a deploy provider's env vars immediately after create will inject a not-yet-reachable database. Gate that injection on status reaching `ACTIVE_HEALTHY`.

---

## 7. Documentation Links

| Topic | URL |
|---|---|
| Management API reference | https://supabase.com/docs/reference/api/introduction |
| Building an integration (OAuth2) | https://supabase.com/docs/guides/integrations/build-a-supabase-integration |
| Rate limits | https://supabase.com/docs/guides/api/rate-limits |
| OpenAPI spec | https://api.supabase.com/api/v1-json |
