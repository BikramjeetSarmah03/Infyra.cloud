# Render — Provider Integration

Deploy targets (web services, static sites) and managed Postgres. Per [tasks.md](../tasks.md), the **first adapter to build** — API-key auth is the simplest lifecycle, so it proves the `ProviderAdapter` interface with the least incidental complexity.

Render is also the only launch provider implementing **both** `DeployAdapter` and `DatabaseAdapter`, which makes it the test case for whether the two-interface split in [adapter-design.md](../adapter-design.md) §2 actually holds.

---

## 1. At a Glance

| | |
|---|---|
| **Base URL** | `https://api.render.com/v1` |
| **Auth type** | `api_key` |
| **Category** | `deploy` + `database` |
| **Adapter interface** | `DeployAdapter` + `DatabaseAdapter` — see §6.1 |
| **Auth header** | `Authorization: Bearer <API_KEY>` |
| **Key creation** | Manual, by the user, in Render Dashboard → Account Settings |
| **Key scoping** | **Account-wide — grants access to *all* workspaces the user belongs to** |
| **Partner approval needed** | No |

---

## 2. Authentication — API Key

No OAuth. The flow is entirely manual on the user's side, which makes it fast to build and the worst UX of the three launch providers.

```
1. User → Render Dashboard → Account Settings → API Keys → create
2. User copies key, returns to infyra.cloud, pastes into connect form
3. infyra calls validateApiKey() live before storing anything
4. On success → envelope-encrypt → provider_connection row
```

### 2.1 `validateApiKey(key)`

```
GET https://api.render.com/v1/owners
Authorization: Bearer <key>
Accept: application/json
```

`/owners` is the right validation call, not `/services`: it confirms the key works **and** returns the workspaces it can reach, which §6.2 needs. A key valid for zero services still returns owners.

Per [modules/provider-connections.md](../modules/provider-connections.md), a pasted-wrong-key error is the most common failure mode here, so validation must give specific feedback rather than "invalid":

| Condition | Message to user |
|---|---|
| 401 | "Render rejected this key. Check you copied the whole value — keys start with `rnd_`." |
| 403 | "This key is valid but lacks permission. Create a new key from Account Settings." |
| Empty owners list | "This key has no accessible Render workspaces." |
| Network/5xx | "Couldn't reach Render. Your key wasn't saved — try again." |

That last one matters: on a network failure the key was *not* validated and *not* stored, and saying "invalid key" would send the user to regenerate a perfectly good key.

---

## 3. Token Lifetime & Refresh

**None.** API keys don't expire and there is no refresh flow. `refresh()` throws `NotSupportedError` per [adapter-design.md](../adapter-design.md) §2.

This inverts where the risk sits compared to OAuth providers:

| | OAuth (Neon/Supabase) | API key (Render) |
|---|---|---|
| Expiry risk | High — needs proactive refresh | None |
| Revocation detection | Refresh failure signals it | **Only a live API call signals it** |
| Blast radius if leaked | Scoped, revocable, expires | **Account-wide, indefinite** |

So for Render the scheduled health check isn't a refresh mechanism, it's the *only* revocation-detection mechanism. `checkHealth()` hitting `GET /owners` is the entire signal.

`checkHealth()` mapping:

| Result | Status |
|---|---|
| 200 | `connected` |
| 401 | `revoked` — key deleted in Render (a *valid-then-401* key was revoked, not mistyped) |
| 403 | `invalid` |
| 429 / 5xx | No status change |

The 401 → `revoked` (not `needs_reauth`) mapping is deliberate: there is no re-auth flow to offer. The user must generate a new key, which is a *new connection*, not a repaired one.

---

## 4. Core Endpoints → Adapter Methods

All paths relative to `https://api.render.com/v1`.

### 4.1 `DeployAdapter`

| Adapter method | HTTP | Path |
|---|---|---|
| `checkHealth()` | `GET` | `/owners` |
| `listResources()` | `GET` | `/services` |
| `createResource()` | `POST` | `/services` |
| — get service | `GET` | `/services/{serviceId}` |
| — update service | `PATCH` | `/services/{serviceId}` |
| `deleteResource()` | `DELETE` | `/services/{serviceId}` |
| `triggerDeploy()` | `POST` | `/services/{serviceId}/deploys` |
| — list deploys | `GET` | `/services/{serviceId}/deploys` |
| `getDeployStatus()` | `GET` | `/services/{serviceId}/deploys/{deployId}` |
| — cancel deploy | `POST` | `/services/{serviceId}/deploys/{deployId}/cancel` |
| **rollback** | `POST` | `/services/{serviceId}/deploys/{deployId}/rollback` |
| `setEnvVars()` | `PATCH` | `/services/{serviceId}/env-vars/{name}` |
| — list env vars | `GET` | `/services/{serviceId}/env-vars` |
| — delete env var | `DELETE` | `/services/{serviceId}/env-vars/{name}` |
| — custom domains | `GET`/`POST` | `/services/{serviceId}/custom-domains` |
| — delete domain | `DELETE` | `/services/{serviceId}/custom-domains/{domainId}` |

**Rollback is a first-class endpoint here.** [product.md](../product.md) §6 lists "rollback to a previous deploy" as a feature, and Render supports it natively — so it should be a real `DeployAdapter` method (`rollbackDeploy()`), not an application-layer re-deploy of an old commit. Adding it to the interface is justified by a provider capability, not speculation.

### 4.2 `DatabaseAdapter`

| Adapter method | HTTP | Path |
|---|---|---|
| `listResources()` (db) | `GET` | `/postgres` |
| `createDatabase()` | `POST` | `/postgres` |
| — get instance | `GET` | `/postgres/{postgresId}` |
| — update instance | `PATCH` | `/postgres/{postgresId}` |
| `deleteResource()` (db) | `DELETE` | `/postgres/{postgresId}` |
| `getConnectionString()` | `GET` | `/postgres/{postgresId}/connection-info` |
| `createBranch()` | — | **`NotSupportedError`** — Render Postgres has no branching |

### 4.3 `setEnvVars()` is per-variable, not bulk

The env-var endpoint is `PATCH .../env-vars/{name}` — one variable per call. `setEnvVars(vars)` takes a map, so the adapter loops.

That means **`setEnvVars()` is not atomic**. A partial failure leaves the service with some new values and some old. The adapter must return which keys succeeded and which failed rather than throwing a bare error, so the caller can report accurately instead of implying nothing was written. This is a real behavioral difference from Vercel, which accepts bulk writes.

### 4.4 Normalizing into `resources`

| `resources` column | Render source |
|---|---|
| `provider_resource_id` | `service.id` (`srv-*`) or `postgres.id` (`dpg-*`) |
| `type` | `web_service` \| `static_site` \| `database`, from `service.type` |
| `status` | Mapped from `service.suspended` + latest deploy status |
| `metadata` | `{ ownerId, plan, region, repo, branch, autoDeploy, serviceType }` |

`ownerId` in `metadata` is not optional — §6.2 depends on it.

---

## 5. Rate Limits & Errors

**Render does not publish rate limits.** Same treatment as Neon: respect `Retry-After` on 429, conservative default bucket per connection.

| HTTP | Normalized error |
|---|---|
| 401 | `AdapterAuthError` |
| 403 | `AdapterAuthError` |
| 404 | `AdapterNotFoundError` |
| 400/422 | `AdapterValidationError` |
| 429 | `AdapterRateLimitError` |
| 5xx | `AdapterUnknownError` |

---

## 6. Adapter Notes

### 6.1 One provider, two category interfaces
Render is both a deploy and a database provider. Options: two registry entries sharing an HTTP client, or one class implementing both interfaces.

**Take two registry entries (`render-deploy`, `render-postgres`) over one dual-interface class.** `ProviderAdapter.category` is a single value, and the registry, the UI's provider list, and `resources.type` filtering all key off it. One adapter with two categories forces every one of those consumers to handle an array instead of a scalar — which is exactly the "interface gap" signal in [adapter-design.md](../adapter-design.md) §6, step 5. Both entries can share one `provider_connection` row, since one API key covers both.

### 6.2 Account-wide keys make application-layer scoping mandatory
This is the case [adapter-design.md](../adapter-design.md) §4 was written for. A Render key reaches **every workspace the user belongs to** — including their unrelated personal projects and other agencies' work.

Concretely:
1. At connect time, `GET /owners` returns reachable workspaces. **Make the user pick which one(s) this connection may use**, and store the chosen `ownerId`s.
2. The adapter always sends `ownerId` on list/create calls, so it never enumerates workspaces the agency didn't select.
3. `provider_connection_scope` rows ([data-model.md](../data-model.md)) constrain which infyra projects may use the connection.

Step 1 is a product requirement, not a nicety: without it, connecting Render to infyra silently grants the agency's whole team visibility into every Render workspace the connecting user can reach. That's a data-exposure bug that looks like a feature.

### 6.3 Deploy status needs polling; there is no push
`getDeployStatus()` is a poll. [architecture.md](../architecture.md) §3 shows the deploy flow ending in "(async) poll or receive provider webhook" — for Render, assume **poll**, and confirm before relying on webhooks. This makes the job-runner decision ([architecture.md](../architecture.md) open question #1) a hard blocker for Render deploys specifically, not just for Observability.

Poll with backoff (deploys run minutes, not seconds) and a hard timeout that marks the deploy `unknown` rather than polling forever.

### 6.4 No idempotency key
Name-based pre-check per [README.md](./README.md#idempotency-support). Render service names are unique per owner, which makes the pre-check reliable here.

### 6.5 `getConnectionString()` returns credentials
Same rule as Neon §4.2 — never persisted to `metadata`, never logged, straight into `setEnvVars()` when auto-injecting.

---

## 7. Documentation Links

| Topic | URL |
|---|---|
| API reference | https://api-docs.render.com/reference/introduction |
| Authentication | https://api-docs.render.com/reference/authentication |
| Rate limiting | https://api-docs.render.com/reference/rate-limiting |
| Docs index for agents | https://api-docs.render.com/llms.txt |

> Appending `.md` to a Render docs URL returns the markdown source — the fastest way to re-verify a request body shape.
