# Cloudflare — Provider Integration

Pages (deploy), Workers (compute), D1 (database), R2 (storage), DNS. Listed in [product.md](../product.md) §4 as **designed for, not yet built**.

Cloudflare is the first provider that spans more than two categories, which makes it the real stress test of the category model in [adapter-design.md](../adapter-design.md) §1.3 — see §6.1.

---

## 1. At a Glance

| | |
|---|---|
| **Base URL** | `https://api.cloudflare.com/client/v4` |
| **Auth type** | `api_key` (scoped API **token** — not the legacy Global API Key) |
| **Category** | `deploy` + `database` + `storage` + `dns` — see §6.1 |
| **Adapter interface** | Multiple registry entries, see §6.1 |
| **Auth header** | `Authorization: Bearer <API_TOKEN>` |
| **Token verify endpoint** | `GET /user/tokens/verify` |
| **Rate limit** | **1200 req / 5 min** per user/account token; **200 req/s** per IP |
| **Partner approval needed** | No |

---

## 2. Authentication — Scoped API Token

Cloudflare offers two credential types. **Use API tokens; never the Global API Key.**

| | API Token (use this) | Global API Key (do not use) |
|---|---|---|
| Scoping | Per-permission, per-resource | Full account access, always |
| Header | `Authorization: Bearer <token>` | `X-Auth-Key` + `X-Auth-Email` |
| Revocable individually | Yes | No — rotating it breaks everything |
| Expiry | Optional TTL | Never |
| IP filtering | Yes | No |

The Global API Key is unscoped and unrevokable-in-isolation. Storing one would mean holding a credential that grants total control of an agency's entire Cloudflare account, including domains and DNS for clients who never consented to infyra touching them. Reject it at the connect form — don't merely prefer tokens.

### 2.1 Connect flow

Like Render, this is a manual paste flow with no OAuth:

```
1. User → Cloudflare Dashboard → My Profile → API Tokens → Create Token
2. User grants the specific permissions from §2.2
3. User pastes token into infyra.cloud
4. validateApiKey() → GET /user/tokens/verify
5. Encrypt, store
```

**Give the user a copy-pasteable permission list at step 2.** Cloudflare's token builder is granular and unguided; an agency that over-grants because infyra didn't say what it needs has been failed by the UX, and an under-grant fails later at an unrelated call site with a confusing 403.

### 2.2 Required token permissions

Ask for exactly what §4 calls, and no more:

| Permission | Scope | Needed for |
|---|---|---|
| `Account.Cloudflare Pages: Edit` | Account | Pages projects + deployments |
| `Account.Workers Scripts: Edit` | Account | Workers deploys |
| `Account.D1: Edit` | Account | D1 databases |
| `Account.Workers R2 Storage: Edit` | Account | R2 buckets |
| `Zone.DNS: Edit` | Specific zones | Custom domains |
| `Zone.Zone: Read` | Specific zones | Zone lookup for domain attach |
| `User.User Details: Read` | User | Health check |

**Scope `Zone.*` to specific zones, not "all zones."** This is the one place the user's choice materially limits blast radius — an all-zones DNS-edit token can repoint any domain in the account.

### 2.3 `validateApiKey(key)`

```
GET https://api.cloudflare.com/client/v4/user/tokens/verify
Authorization: Bearer <token>
```

Returns the token's ID and status. This is a purpose-built verification endpoint — better than probing a resource endpoint, because it distinguishes "token invalid" from "token valid but lacks this permission."

Validation must go further than a 200, though: verify the token actually carries the §2.2 permissions and report which are missing. A token that verifies but can't create a Pages project has passed validation and will still fail at first use.

New tokens use the `cfut_` prefix (scannable format) — useful for a client-side format hint before the round-trip.

---

## 3. Token Lifetime & Refresh

API tokens **may** have a TTL, set by the user at creation. No refresh flow; `refresh()` throws `NotSupportedError`.

This is the third distinct expiry model in the product, and it's the awkward one:

| Provider | Expiry | Known to infyra in advance? |
|---|---|---|
| Render | Never | N/A |
| Neon / Supabase OAuth | Yes | Yes — `expires_in` on every response |
| **Cloudflare** | **User's choice** | **Only if we read it at connect time** |

`GET /user/tokens/verify` returns the token's status, and the token's `expires_on` is readable via the tokens API. **Capture expiry at connect time and store it**, so the scheduled health check can warn *before* expiry rather than reporting a dead connection after. A token that silently expires mid-provisioning is the failure this avoids — and per [modules/provider-connections.md](../modules/provider-connections.md), that's exactly the scenario where a stale status is worse than none.

Where expiry is known, surface it in the connection UI and alert ahead of it ([product.md](../product.md) §8 already has an alerts surface for "domain/SSL expiry" — token expiry belongs in the same channel).

---

## 4. Core Endpoints → Adapter Methods

All paths relative to `https://api.cloudflare.com/client/v4`. `{account_id}` comes from `GET /accounts`.

### 4.1 Pages (`DeployAdapter`)

| Adapter method | HTTP | Path |
|---|---|---|
| `checkHealth()` | `GET` | `/user/tokens/verify` |
| `listResources()` | `GET` | `/accounts/{account_id}/pages/projects` |
| `createResource()` | `POST` | `/accounts/{account_id}/pages/projects` |
| — get project | `GET` | `/accounts/{account_id}/pages/projects/{project_name}` |
| `deleteResource()` | `DELETE` | `/accounts/{account_id}/pages/projects/{project_name}` |
| `triggerDeploy()` | `POST` | `/accounts/{account_id}/pages/projects/{project_name}/deployments` |
| `getDeployStatus()` | `GET` | `/accounts/{account_id}/pages/projects/{project_name}/deployments/{deployment_id}` |
| — list deploys | `GET` | `/accounts/{account_id}/pages/projects/{project_name}/deployments` |
| — rollback | `POST` | `/accounts/{account_id}/pages/projects/{project_name}/deployments/{deployment_id}/retry` |
| `setEnvVars()` | `PATCH` | `/accounts/{account_id}/pages/projects/{project_name}` |
| — domains | `GET`/`POST` | `/accounts/{account_id}/pages/projects/{project_name}/domains` |

**Pages env vars are set by PATCHing the whole project object**, not via a dedicated env endpoint (`deployment_configs.production.env_vars`). That's a read-modify-write: fetch current config, merge, PATCH. Two concurrent `setEnvVars()` calls can lose one another's writes — serialize per project, per [README.md](./README.md#idempotency-support)'s note on job-runner serialization.

### 4.2 D1 (`DatabaseAdapter`)

| Adapter method | HTTP | Path |
|---|---|---|
| `listResources()` | `GET` | `/accounts/{account_id}/d1/database` |
| `createDatabase()` | `POST` | `/accounts/{account_id}/d1/database` |
| — get database | `GET` | `/accounts/{account_id}/d1/database/{database_id}` |
| `deleteResource()` | `DELETE` | `/accounts/{account_id}/d1/database/{database_id}` |
| — query | `POST` | `/accounts/{account_id}/d1/database/{database_id}/query` |
| `getConnectionString()` | — | **`NotSupportedError`** — see §6.2 |
| `createBranch()` | — | **`NotSupportedError`** |

### 4.3 R2 (storage) and DNS

| Operation | HTTP | Path |
|---|---|---|
| List buckets | `GET` | `/accounts/{account_id}/r2/buckets` |
| Create bucket | `POST` | `/accounts/{account_id}/r2/buckets` |
| Delete bucket | `DELETE` | `/accounts/{account_id}/r2/buckets/{bucket_name}` |
| List DNS records | `GET` | `/zones/{zone_id}/dns_records` |
| Create DNS record | `POST` | `/zones/{zone_id}/dns_records` |
| List zones | `GET` | `/zones` |

R2's data plane is S3-compatible and separate from this API — bucket *management* is here, object operations are not. If infyra ever touches objects (it currently shouldn't), that's a different client entirely.

### 4.4 Response envelope

Every Cloudflare response is wrapped:

```jsonc
{
  "success": true,
  "errors": [],
  "messages": [],
  "result": { }
}
```

**`success: false` can accompany HTTP 200.** Status-code-only error handling will silently treat failures as successes. The adapter must check `success` on every response and map `errors[].code` — this is Cloudflare's biggest departure from the other providers' conventions and the most likely source of a silent-corruption bug.

---

## 5. Rate Limits & Errors

| Limit | Value |
|---|---|
| Per user/account token | **1200 requests / 5 minutes** |
| Per IP | **200 requests / second** |

Exceeding the first blocks *all* API calls for the next five minutes with HTTP 429.

Two things make this stricter than it looks:

1. **The limit is cumulative across the dashboard and every token on the account.** An agency clicking around their Cloudflare dashboard consumes the same budget as infyra's health checks. infyra must not assume it owns the full 1200.
2. **The per-IP limit is a shared-fate risk.** All of `apps/server`'s outbound Cloudflare traffic likely shares one egress IP, so *every* workspace's Cloudflare calls draw on one 200 req/s pool. One agency's bulk operation can 429 another's. This is [architecture.md](../architecture.md) open question #4 in its sharpest form — Cloudflare needs a **global** limiter (per egress IP) in addition to the per-connection one every other provider needs.

| Condition | Normalized error |
|---|---|
| HTTP 401 / code 10000 | `AdapterAuthError` |
| HTTP 403 | `AdapterAuthError` — missing token permission (§2.2) |
| HTTP 404 | `AdapterNotFoundError` |
| HTTP 400 + `success: false` | `AdapterValidationError` |
| HTTP 429 | `AdapterRateLimitError` |
| HTTP 5xx | `AdapterUnknownError` |
| **HTTP 200 + `success: false`** | Map from `errors[].code` — never treat as success |

---

## 6. Adapter Notes

### 6.1 Four categories, one credential — split the registry entries
Cloudflare spans deploy (Pages), database (D1), storage (R2), and dns. Following [render.md](./render.md) §6.1, register separate entries (`cloudflare-pages`, `cloudflare-d1`, `cloudflare-r2`) sharing one `provider_connection` row and one HTTP client.

DNS is the interesting one: it isn't a resource category, it's a **capability other categories consume** (domain attachment for Pages, and potentially for Render/Vercel projects too). Don't model DNS as a `ProviderAdapter` category. It's closer to a cross-cutting service — which is a genuine gap in the current interface, and per [adapter-design.md](../adapter-design.md) §6 step 5, the signal to fix the interface rather than special-case around it. Flag it as a design question to resolve *before* Cloudflare is built, not during.

### 6.2 D1 has no connection string
D1 is accessed via Workers bindings or the HTTP query endpoint — there is no Postgres-style URI. So `getConnectionString()` throws `NotSupportedError`, and **the auto-inject-connection-string flow in [product.md](../product.md) §6 does not apply to D1 at all.**

This is worth stating plainly because it breaks an assumption the product doc makes implicitly: that a provisioned database yields a connection string injectable into a deploy target. D1 provisioning would need a different linking mechanism (a Workers binding), which is a product decision, not just an adapter one.

### 6.3 `account_id` is required everywhere and isn't in the token
Nearly every path embeds `{account_id}`. Resolve it via `GET /accounts` at connect time and store it on the connection — same pattern as Render's `ownerId` ([render.md](./render.md) §6.2) and Vercel's `teamId` ([vercel.md](./vercel.md) §6.2).

Three of five providers needing a stored account-scope identifier resolved at connect time is a pattern, not a coincidence: **the base `provider_connection` row should have a first-class `provider_account_id` column** rather than each adapter burying it in `metadata`. By the promotion rule in [adapter-design.md](../adapter-design.md) §5 ("any field two or more current providers share gets promoted"), this clears the bar decisively.

### 6.4 Pages project names are immutable and globally scoped per account
The project name is the identifier in every path — there is no separate ID. Renaming isn't possible; `provider_resource_id` stores the name. Deterministic naming (§ the [neon.md](./neon.md) §4.1 rule) is therefore mandatory, not just convenient for idempotency.

### 6.5 No idempotency key
Name-based pre-check. Reliable here since names are unique per account.

---

## 7. Documentation Links

| Topic | URL |
|---|---|
| API reference | https://developers.cloudflare.com/api/ |
| Getting started / auth | https://developers.cloudflare.com/fundamentals/api/get-started/ |
| Create an API token | https://developers.cloudflare.com/fundamentals/api/get-started/create-token/ |
| API limits | https://developers.cloudflare.com/fundamentals/api/reference/limits/ |
| Pages API | https://developers.cloudflare.com/pages/configuration/api/ |
| D1 API | https://developers.cloudflare.com/d1/ |
| R2 API | https://developers.cloudflare.com/r2/api/ |
