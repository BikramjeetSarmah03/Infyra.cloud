# Azure — Provider Integration

Blob Storage (storage) and adjacent services. Listed in [product.md](../product.md) §4 as **designed for, not yet built**.

Third `cloud_role` provider. Azure's model is the outlier of the three: instead of federating an external identity ([gcp.md](./gcp.md)) or trusting an external account ([aws.md](./aws.md)), infyra registers a **multi-tenant application** in its own Entra ID tenant, and each customer consents to it — giving infyra a service principal inside their tenant.

---

## 1. At a Glance

| | |
|---|---|
| **Base URL** | `https://management.azure.com` (ARM); `https://{account}.blob.core.windows.net` (data) |
| **Auth type** | `cloud_role` — multi-tenant app + client credentials |
| **Category** | `storage` (Blob Storage first) |
| **Adapter interface** | `StorageAdapter extends ProviderAdapter` — see [aws.md](./aws.md) §6.1 |
| **Token endpoint** | `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` |
| **Credential TTL** | **~1 hour** (`expires_in: 3599`) |
| **Partner approval needed** | No — but customer admin consent is required |

---

## 2. Authentication — Multi-Tenant App + Admin Consent

Two steps, and they're conceptually distinct: a **one-time consent** that creates infyra's service principal in the customer's tenant, then **per-call token acquisition** using infyra's own credentials.

### 2.1 Step 1 — Admin consent (one-time, per customer tenant)

```
GET https://login.microsoftonline.com/{tenant}/adminconsent
  ?client_id=<INFYRA_APP_CLIENT_ID>
  &state=<opaque, single-use, workspace-bound>
  &redirect_uri=https://api.infyra.cloud/connections/azure/callback
```

| Parameter | Required | Notes |
|---|---|---|
| `tenant` | Required | GUID or domain. Use `common` if the customer's tenant is unknown |
| `client_id` | Required | infyra's app registration |
| `redirect_uri` | Required | Exact match with registered value |
| `state` | Recommended | Treat as **required** — same opaque-token rule as [neon.md](./neon.md) §6.2 |

**Only a tenant administrator can complete this.** That's a product constraint, not just a technical one: the agency user connecting Azure in infyra may not be their own Azure admin, so the connect flow needs a "send this link to your admin" path. Assuming the connecting user can consent will strand a meaningful share of attempts.

Success redirects with `tenant=<GUID>`, `state`, `admin_consent=True`. **Store the returned tenant ID** — every subsequent token request needs it.

Denial returns `error=permission_denied` — handle it as a first-class outcome, per the OAuth-consent-denied edge case in [modules/provider-connections.md](../modules/provider-connections.md).

### 2.2 Step 2 — RBAC role assignment (still customer-side)

**Consent alone grants nothing on their subscription.** It creates the service principal; the customer must then assign it an Azure RBAC role (e.g. `Storage Account Contributor`) scoped to a subscription or resource group.

This two-part setup is the most common Azure integration failure: consent succeeds, the connection looks connected, and the first real operation fails with a bare 403. **`checkHealth()` must verify the role assignment, not just token acquisition** (§3) — otherwise infyra reports a healthy connection that cannot do anything.

### 2.3 Step 3 — Token acquisition (`assumeCredential`, per call)

```
POST https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id=<INFYRA_APP_CLIENT_ID>
&client_secret=<INFYRA_APP_SECRET>
&scope=https%3A%2F%2Fmanagement.azure.com%2F.default
&grant_type=client_credentials
```

| Parameter | Notes |
|---|---|
| `tenant` (in path) | The customer's tenant ID from §2.1 |
| `client_id` | infyra's app ID |
| `client_secret` | **infyra's secret — must be URL-encoded** |
| `scope` | Resource URI + `/.default`. **One resource per request** — ARM and Blob need separate tokens |
| `grant_type` | `client_credentials` |

Response:

```jsonc
{ "token_type": "Bearer", "expires_in": 3599, "access_token": "eyJ0eXAi..." }
```

**No refresh token is issued, by design** — with client credentials, infyra can always just request a new token. `refresh()` throws `NotSupportedError`; re-acquire instead.

---

## 3. Credential Lifetime

| | |
|---|---|
| Access token | **~1 hour** (`expires_in: 3599`) |
| Refresh token | **Never issued** |
| Renewal | Repeat §2.3 |

Cache per `(tenant_id, scope)` in memory for the token's life; never persist. Same rule as [aws.md](./aws.md) §3.

### What's stored at rest — and why Azure is the weak one

| Provider | Stored blob | Contains a usable secret? |
|---|---|---|
| AWS | Role ARN + external ID | **No** |
| GCP | Pool/provider/SA identifiers | **No** |
| **Azure** | Tenant ID + client ID (+ infyra's app secret in `packages/env`) | **Per-connection: no. Globally: yes** |

The per-connection row holds no secret — but infyra's **single app secret** unlocks every consented tenant. That's a materially different risk profile from the other two: one leaked value compromises every Azure customer at once, where AWS and GCP have no such global key.

Two mitigations, both worth doing:
1. **Use a certificate credential instead of a shared secret.** Azure supports `client_assertion` with a signed JWT — keeps the private key in KMS/HSM rather than as an env-var string.
2. **Use a federated credential.** Azure accepts a JWT from an external OIDC issuer — the same issuer GCP requires ([gcp.md](./gcp.md) §2.4), so building it once serves both and eliminates infyra's long-lived Azure secret entirely.

Given the issuer is already required for GCP, option 2 is the one to plan for. It removes the highest-value single secret in the product.

### `checkHealth()`

| Outcome | Status |
|---|---|
| Token acquired **and** a scoped ARM read succeeds | `connected` |
| Token acquired, ARM read returns 403 | `needs_reauth` — consent present, **RBAC missing** (§2.2) |
| Token request returns `invalid_client` | `invalid` — **infyra's secret is wrong/expired**; alert internally |
| Token request says principal not found | `revoked` — admin removed the service principal |
| 429 / 5xx | No status change |

The first row is the important one: **two calls, not one.** Token acquisition alone is not a health signal in Azure.

---

## 4. Core Endpoints → Adapter Methods

Use the Azure SDK inside the adapter — same reasoning as [aws.md](./aws.md) §4.

### 4.1 Storage accounts / Blob (`StorageAdapter`)

All ARM paths under `https://management.azure.com`, all requiring `?api-version=2023-05-01`.

| Adapter method | HTTP | Path |
|---|---|---|
| — list subscriptions | `GET` | `/subscriptions` |
| `listResources()` | `GET` | `/subscriptions/{sub}/providers/Microsoft.Storage/storageAccounts` |
| `createResource()` | `PUT` | `/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{name}` |
| — get account | `GET` | `/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{name}` |
| `deleteResource()` | `DELETE` | `/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{name}` |
| — list keys | `POST` | `/subscriptions/{sub}/.../storageAccounts/{name}/listKeys` |
| — create container | `PUT` | `/subscriptions/{sub}/.../storageAccounts/{name}/blobServices/default/containers/{container}` |
| `getUsage()` | `GET` | `/subscriptions/{sub}/.../providers/Microsoft.Insights/metrics` |

**`api-version` is mandatory on every ARM call** and omitting it is a 400, not a default-to-latest. Centralize it in the adapter's client rather than repeating it per method.

### 4.2 Minimum RBAC role

`Storage Account Contributor`, scoped to a subscription or resource group — manage storage accounts without a data-plane key.

Note the tension with [aws.md](./aws.md) §4.3's no-data-access stance: the `listKeys` operation returns account keys granting full data access. **Only call `listKeys` when a specific feature requires it**, and treat the result exactly like a connection string ([neon.md](./neon.md) §4.2) — never persisted, never logged. If no feature needs it, prefer a role that excludes it.

### 4.3 Normalizing into `resources`

| `resources` column | Azure source |
|---|---|
| `provider_resource_id` | Full ARM resource ID (`/subscriptions/.../storageAccounts/x`) |
| `type` | `object_storage` |
| `status` | From `properties.provisioningState` (`Succeeded`, `Creating`, `Failed`) |
| `metadata` | `{ tenantId, subscriptionId, resourceGroup, location, sku, kind, accessTier }` |

Use the **full ARM resource ID** as `provider_resource_id`, not the account name — it's the only globally unambiguous identifier and it encodes subscription and resource group, which every subsequent call needs.

---

## 5. Rate Limits & Errors

ARM applies per-subscription, per-operation-type throttling and returns `x-ms-ratelimit-remaining-*` headers with `Retry-After` on 429. Read them rather than guessing.

| Azure error | Normalized error |
|---|---|
| 401, `InvalidAuthenticationToken` | `AdapterAuthError` |
| 403, `AuthorizationFailed` | `AdapterAuthError` — usually missing RBAC (§2.2) |
| 404, `ResourceNotFound` | `AdapterNotFoundError` |
| 400, `InvalidParameter` | `AdapterValidationError` |
| 409, `StorageAccountAlreadyTaken` | `AdapterValidationError` — see §6.3 |
| 429, `TooManyRequests` | `AdapterRateLimitError` — carry `Retry-After` |
| 5xx | `AdapterUnknownError` |

`AADSTS*` codes from the token endpoint deserve their own mapping — they're infyra-config problems (`AADSTS7000215`, invalid secret) far more often than customer problems, and misrouting them produces "please reconnect" messages to agencies for a fault they cannot fix.

---

## 6. Adapter Notes

### 6.1 Resource groups have no analogue in the other providers
Every Azure resource lives in a resource group — a required container with no counterpart in AWS, GCP, Neon, or Render. Two options: require the customer to nominate one at connect time, or have infyra create a dedicated `infyra-managed` group.

**Prefer creating a dedicated group.** It keeps infyra-provisioned resources visibly separate from the customer's own, makes cleanup tractable, and avoids infyra writing into a group with unrelated production infrastructure. It does require `Contributor` at subscription scope to create — a broader grant, which is the trade-off to state plainly in the connect UI rather than bury.

### 6.2 Prefer federated credentials over the shared secret
Per §3 — this is the highest-value hardening decision in this doc. Azure supports `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer` with a JWT from an external OIDC issuer, which infyra needs for GCP anyway ([gcp.md](./gcp.md) §2.4). Build the issuer once; drop infyra's long-lived Azure secret entirely.

Certificate credentials are the intermediate option if the issuer isn't ready — still better than a shared secret in an env var.

### 6.3 Storage account names are globally unique and unusually restrictive
3–24 characters, **lowercase letters and digits only** — no hyphens, no underscores. A deterministic name like `infyra-<workspace>-<project>` is invalid on multiple counts.

So the naming scheme used everywhere else in these docs ([neon.md](./neon.md) §4.1) simply cannot be applied here. Derive a compliant name (e.g. a truncated hash) and store the actual value as `provider_resource_id`. Idempotency falls back to the name-based pre-check plus job-runner serialization.

### 6.4 One connection can span multiple subscriptions
Unlike GCP's one-project-per-connection ([gcp.md](./gcp.md) §6.5), a consented service principal can hold RBAC across many subscriptions in the tenant. `GET /subscriptions` enumerates what it can reach.

That makes Azure's scoping problem the same as Render's ([render.md](./render.md) §6.2): **make the user select which subscriptions this connection may use at connect time**, and store the selection. Otherwise a single connection silently exposes the agency's entire Azure estate to infyra.

### 6.5 The multi-tenant app registration is shared infrastructure
One app registration in infyra's own tenant serves every customer. Its secret/certificate expiry is a **global** outage risk — expiry breaks every Azure connection simultaneously, and the failure mode is `invalid_client` across the board. Track its expiry as production infrastructure with alerting, not as a config value someone will remember to rotate.

---

## 7. Documentation Links

| Topic | URL |
|---|---|
| Client credentials flow | https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow |
| Multi-tenant apps | https://learn.microsoft.com/en-us/entra/identity-platform/howto-convert-app-to-be-multi-tenant |
| Admin consent | https://learn.microsoft.com/en-us/entra/identity-platform/v2-admin-consent |
| Certificate credentials | https://learn.microsoft.com/en-us/entra/identity-platform/certificate-credentials |
| Workload identity federation | https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation |
| Storage Resource Provider API | https://learn.microsoft.com/en-us/rest/api/storagerp/ |
| ARM throttling | https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/request-limits-and-throttling |
