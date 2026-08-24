# Vercel — Provider Integration

Deploy target. Listed in [product.md](../product.md) §4 as **designed for, not yet built** — this doc is the pre-work so it stays additive when it lands.

Vercel is the closest analogue to Render in the product's model, which makes it the honest test of the claim that adding a provider is "one adapter file + registration."

---

## 1. At a Glance

| | |
|---|---|
| **Base URL** | `https://api.vercel.com` |
| **Auth type** | `oauth` (Vercel Integration flow) — or PAT, see §6.1 |
| **Category** | `deploy` |
| **Adapter interface** | `DeployAdapter extends ProviderAdapter` |
| **Auth header** | `Authorization: Bearer <access_token>` |
| **Team scoping** | `?teamId=<team_id>` query param on every request — see §6.2 |
| **Partner approval needed** | Yes — Integration registered in Vercel Integration Console |

Vercel versions per endpoint (`/v1/...`, `/v2/...`, `/v9/...`, `/v13/...`), not globally. There is no single API version to pin.

---

## 2. Authentication — Vercel Integration OAuth

Vercel's flow is an OAuth variant built around *integration installation* rather than plain user authorization. The user installs the infyra integration onto a personal account or a team; that installation is a **configuration** (`icfg_*`).

### 2.1 Authorize / install

The user is sent to the integration's install URL (from the Integration Console). On completion Vercel redirects to the configured **Redirect URL** with:

| Query param | Meaning |
|---|---|
| `code` | Short-lived authorization code — **valid 30 minutes, exchangeable exactly once** |
| `configurationId` | The `icfg_*` installation ID |
| `teamId` | Present if installed on a team; absent/null for a personal account |
| `next` | Where to send the user after infyra finishes setup |

### 2.2 Token exchange (`exchangeCode(code)`)

```
POST https://api.vercel.com/v2/oauth/access_token
Content-Type: application/x-www-form-urlencoded

client_id=<INFYRA_VERCEL_CLIENT_ID>
&client_secret=<INFYRA_VERCEL_CLIENT_SECRET>
&code=<code>
&redirect_uri=<the Redirect URL configured in the Integration Console>
```

All four parameters are required. The response includes `access_token`, `team_id`, and installation context.

**Store `team_id` and `configurationId` on the connection row** (in `metadata` or dedicated columns) — §6.2 shows why every subsequent call depends on it.

### 2.3 Scopes

Set in the Integration Console, not per-authorize-request (same constraint as [supabase.md](./supabase.md) §2.1). Relevant subset:

| Scope | Needed for |
|---|---|
| `integration-configuration` | Reading the installation itself |
| `project` | `listResources()`, project CRUD |
| `deployment` | `triggerDeploy()`, `getDeployStatus()` |
| `project-env-vars` | `setEnvVars()` — integration-owned vars only |
| `global-project-env-vars` | All project env vars — broader; see §6.4 |
| `domain` | Domain management (**requires `project` write too**) |
| `team` / `user` | Identity, health check |

**Scope changes have asymmetric mechanics and this shapes the rollout plan:** additions require review and per-user/team confirmation via email, and apply only once confirmed; removals apply immediately with no confirmation. So under-scoping at launch is expensive to fix (an email round-trip with every connected agency), while over-scoping is cheap to walk back. Given [product.md](../product.md) §11's provider-risk-isolation principle, still scope to what §4 actually calls — but decide the full §4 surface *before* registering, not iteratively.

---

## 3. Token Lifetime & Refresh

Vercel integration access tokens are **long-lived** — the docs describe exchanging a short-lived code for a "long-lived access token" and document no refresh-token flow.

So Vercel sits between the two auth models already in the product:

| | Render (`api_key`) | **Vercel** | Neon/Supabase (`oauth`) |
|---|---|---|---|
| Expires | No | Not documented | Yes |
| Refresh flow | No | **No** | Yes |
| Revocation detection | Live call | **Live call** | Refresh failure |

`refresh()` throws `NotSupportedError`. Revocation is detected only by `checkHealth()` making a real call — same as Render, despite `authType: "oauth"`.

**This breaks a tempting assumption**: that `authType === "oauth"` implies a refresh path exists. Any shared OAuth helper must treat refresh as an optional capability per adapter, not as implied by the auth type. Worth encoding as an explicit `supportsRefresh` capability flag rather than letting call sites infer it.

### Health check → status

| Signal | Status |
|---|---|
| `GET /v2/user` succeeds | `connected` |
| 403 + `integration_configuration_disabled` | `invalid` — **infyra-side problem**, see §6.3 |
| 401 | `revoked` — user uninstalled the integration |
| 429 / 5xx | No status change |

---

## 4. Core Endpoints → Adapter Methods

Every call also takes `?teamId=` when the installation is team-scoped (§6.2).

| Adapter method | HTTP | Path |
|---|---|---|
| `checkHealth()` | `GET` | `/v2/user` |
| `listResources()` | `GET` | `/v9/projects` |
| `createResource()` | `POST` | `/v11/projects` |
| — get project | `GET` | `/v9/projects/{idOrName}` |
| `deleteResource()` | `DELETE` | `/v9/projects/{idOrName}` |
| `triggerDeploy()` | `POST` | `/v13/deployments` |
| `getDeployStatus()` | `GET` | `/v13/deployments/{idOrUrl}` |
| — list deploys | `GET` | `/v6/deployments` |
| — cancel deploy | `PATCH` | `/v12/deployments/{id}/cancel` |
| `setEnvVars()` | `POST` | `/v10/projects/{idOrName}/env` |
| — list env vars | `GET` | `/v9/projects/{idOrName}/env` |
| — update env var | `PATCH` | `/v9/projects/{idOrName}/env/{envId}` |
| — delete env var | `DELETE` | `/v9/projects/{idOrName}/env/{envId}` |
| — add domain | `POST` | `/v10/projects/{idOrName}/domains` |
| — verify domain | `POST` | `/v9/projects/{idOrName}/domains/{domain}/verify` |
| — integration config | `GET` | `/v1/integrations/configuration/{id}` |

> Version numbers move. Re-verify against https://vercel.com/docs/rest-api before implementing — the paths above are current as of this doc's writing, and the per-endpoint versioning means a stale path fails as a 404 rather than a clear deprecation error.

### 4.1 `setEnvVars()` accepts bulk writes

`POST /v10/projects/{id}/env` takes an array. Contrast [render.md](./render.md) §4.3, where each variable is a separate call and partial failure is possible. Vercel's bulk write is closer to atomic, so the adapter's return shape should still be "which keys succeeded" for interface consistency — but the failure mode is materially less messy here.

Env vars are per-`target` (`production` / `preview` / `development`), which maps cleanly onto [product.md](../product.md) §6's per-environment requirement — cleaner than Render, which has no native environment dimension.

### 4.2 Normalizing into `resources`

| `resources` column | Vercel source |
|---|---|
| `provider_resource_id` | `project.id` (`prj_*`) |
| `type` | `web_service` |
| `status` | Derived from latest deployment `readyState` |
| `metadata` | `{ teamId, configurationId, framework, gitRepository, targets, latestDeploymentId }` |

---

## 5. Rate Limits & Errors

Vercel rate-limits per endpoint class and returns `X-RateLimit-*` headers. No single published number — drive backoff from the headers.

| HTTP | Normalized error |
|---|---|
| 401 | `AdapterAuthError` |
| 403 + `integration_configuration_disabled` | `AdapterAuthError` — §6.3 |
| 403 (other) | `AdapterAuthError` — often a missing `teamId` (§6.2) |
| 404 | `AdapterNotFoundError` |
| 400/422 | `AdapterValidationError` |
| 429 | `AdapterRateLimitError` |
| 5xx | `AdapterUnknownError` |

---

## 6. Adapter Notes

### 6.1 PAT as the interim path
Vercel PATs work against the same endpoints with the same header. Same pattern as [neon.md](./neon.md) §6.1 — separate registry entry, not a flag.

### 6.2 `teamId` is required and its absence fails as 403, not 404
If the integration is installed on a team, **every** API request needs `?teamId=<team_id>`. Omitting it returns 403 Forbidden — which reads as a permissions problem and sends you debugging scopes instead of query params.

Encode it structurally: the adapter's HTTP client appends `teamId` from the stored connection automatically. Do not leave it to individual method implementations to remember — that's a bug that appears only for team-installed connections and passes every personal-account test.

### 6.3 Integration configurations can be disabled by *our* org changes
If the owner of the infyra integration leaves the Vercel team that owns it, Vercel flags the integration disabled: all API requests fail 403 `integration_configuration_disabled`, most webhooks pause, and there's a 30-day window to transfer ownership before deletion.

This is a provider-risk failure mode with no analogue in the other providers: **an internal infyra personnel change can break every connected agency's Vercel integration simultaneously.** Two things follow:
1. Integration ownership must sit with a role account, not an individual's personal Vercel account.
2. The `checkHealth()` mapping must distinguish this from user-side revocation (§3), because the remediation is infyra's, not the agency's — telling agencies to reconnect would be both useless and alarming.

### 6.4 Prefer `project-env-vars` over `global-project-env-vars`
`project-env-vars` limits infyra to variables its own integration created. `global-project-env-vars` grants read/write over *all* env vars in every accessible project — including secrets infyra has no business reading.

Start with the narrow scope. Per §2.3 widening later costs a confirmation round-trip, but that's the correct trade against holding an agency's unrelated production secrets. If auto-injection of connection strings ([product.md](../product.md) §6) turns out to need the broader scope, that's a deliberate decision to document — not something to grant preemptively "in case."

### 6.5 Never call the API from the browser
Vercel's docs call this out and it aligns with [architecture.md](../architecture.md) §4: the token grants access to the whole team account. `apps/platform` never sees it. Noted here only because Vercel's own integration examples sometimes show client-side usage.

---

## 7. Documentation Links

| Topic | URL |
|---|---|
| REST API reference | https://vercel.com/docs/rest-api |
| Building integrations | https://vercel.com/docs/integrations/create-integration/vercel-api-integrations |
| Submitting an integration | https://vercel.com/docs/integrations/create-integration/submit-integration |
| Marketplace API | https://vercel.com/docs/integrations/create-integration/marketplace-api |
