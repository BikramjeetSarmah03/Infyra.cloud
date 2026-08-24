# Google Cloud — Provider Integration

Cloud Storage (storage) and adjacent services. Listed in [product.md](../product.md) §4 as **designed for, not yet built**.

Second `cloud_role` provider after [aws.md](./aws.md). The mechanism differs — OIDC federation rather than account-principal trust — but the *shape* is identical: infyra stores a durable reference to a customer-side trust grant and mints a short-lived credential per call. That two providers with unrelated IAM designs land on the same shape is the evidence that `cloud_role` is a real auth type, not an AWS-specific special case.

---

## 1. At a Glance

| | |
|---|---|
| **Base URL** | Per-service: `https://storage.googleapis.com/storage/v1`, `https://sts.googleapis.com/v1` |
| **Auth type** | `cloud_role` — Workload Identity Federation (WIF) |
| **Category** | `storage` (GCS first) |
| **Adapter interface** | `StorageAdapter extends ProviderAdapter` — see [aws.md](./aws.md) §6.1 |
| **Auth header** | `Authorization: Bearer <federated or impersonated access token>` |
| **Credential TTL** | **~1 hour** (default; extendable only via org policy) |
| **Partner approval needed** | No — but customer-side setup is required |

---

## 2. Authentication — Workload Identity Federation

**Do not use service account keys.** Google is explicit that they're powerful long-lived credentials whose security burden WIF exists to eliminate. A downloaded JSON key stored in infyra's database would be the single worst credential in the whole product: long-lived, fully privileged, and useless to rotate at scale.

WIF instead lets infyra authenticate as *itself* (via an OIDC token infyra issues) and have Google exchange that for short-lived GCP credentials — provided the customer has configured trust.

### 2.1 The trust relationship

infyra runs an OIDC issuer. The customer creates a workload identity pool that trusts it.

| Direction | Item |
|---|---|
| infyra → customer | Issuer URI (e.g. `https://oidc.infyra.cloud`) |
| infyra → customer | The `subject` claim infyra will assert — **unique per workspace** |
| infyra → customer | Required IAM roles for the service account |
| customer → infyra | Pool ID, provider ID, project number, service account email |

Customer-side setup:

1. Create a workload identity pool.
2. Add an OIDC provider in that pool pointing at infyra's issuer URI, with an **attribute condition** restricting which subjects may authenticate.
3. Create a service account with the §4.3 permissions.
4. Grant `roles/iam.workloadIdentityUser` on that SA to the specific federated identity.

**Step 2's attribute condition is the security boundary — it is GCP's analogue of AWS's `ExternalId`.** Without it, the pool trusts *every* identity infyra's issuer can mint, meaning any infyra workspace could obtain credentials to this customer's project. The condition must pin the subject to the one workspace:

```
assertion.sub == "workspace:<workspace_id>"
```

As with AWS's external-ID verification ([aws.md](./aws.md) §2.2 rule 4), **verify this at connect time**: attempt the exchange with a deliberately different subject and confirm it fails. A pool that accepts any subject is misconfigured, and infyra should refuse to store the connection rather than silently operate inside a broken boundary.

### 2.2 Token exchange (`assumeCredential`, step 1)

```
POST https://sts.googleapis.com/v1/token
Content-Type: application/json

{
  "grantType":           "urn:ietf:params:oauth:grant-type:token-exchange",
  "audience":            "//iam.googleapis.com/projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/<POOL_ID>/providers/<PROVIDER_ID>",
  "scope":               "https://www.googleapis.com/auth/cloud-platform",
  "requestedTokenType":  "urn:ietf:params:oauth:token-type:access_token",
  "subjectTokenType":    "urn:ietf:params:oauth:token-type:jwt",
  "subjectToken":        "<infyra-issued OIDC JWT asserting sub=workspace:<id>>"
}
```

Returns a **federated access token**.

### 2.3 Service account impersonation (`assumeCredential`, step 2)

The federated token usually can't act directly on resources; impersonate the customer's service account:

```
POST https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/<SA_EMAIL>:generateAccessToken
Authorization: Bearer <federated access token>
Content-Type: application/json

{
  "scope":    ["https://www.googleapis.com/auth/cloud-platform"],
  "lifetime": "3600s"
}
```

Returns `accessToken` + `expireTime`. **This is the two-step nature of GCP's flow** and the main structural difference from AWS's single `AssumeRole` call — the adapter's `assumeCredential()` encapsulates both, and callers see one method.

### 2.4 infyra must run an OIDC issuer

This is a real infrastructure prerequisite with no analogue in any other provider, and it should be scoped as such rather than discovered mid-implementation:

- A stable public issuer URL serving `/.well-known/openid-configuration` and a JWKS endpoint.
- Signing key management and rotation (KMS-backed, consistent with [nfr.md](../nfr.md) §1's stance on credential encryption keys).
- Per-workspace JWT minting with correct `sub`, `aud`, and short expiry.

The same issuer serves Azure's federated-credential option ([azure.md](./azure.md) §6.2), so it's shared infrastructure across two providers — which improves the cost/benefit, but doesn't change that it must exist before either can ship.

---

## 3. Credential Lifetime

| | |
|---|---|
| Federated token | Short-lived |
| Impersonated SA token | **1 hour default** |
| Beyond 1 hour | Requires the customer to set `constraints/iam.allowServiceAccountCredentialLifetimeExtension` |

Assume **1 hour and do not request more.** Requesting longer lifetimes needs an org-policy change on the customer's side — asking an agency's GCP admin to relax an organization constraint so a SaaS tool can hold longer credentials is a bad ask and a likely deal-blocker at any security-conscious customer.

Nothing secret is stored at rest. The connection row holds pool/provider/project/SA identifiers — the same "reference, not secret" property as [aws.md](./aws.md) §3.

### `checkHealth()`

Performing the §2.2 + §2.3 exchange *is* the health check.

| Outcome | Status |
|---|---|
| Both steps succeed | `connected` |
| STS rejects the subject token | `revoked` — pool/provider deleted or condition changed |
| Impersonation returns 403 | `needs_reauth` — SA binding removed; pool still fine |
| infyra's own JWT is malformed/unsigned | `invalid` — **infyra-side**; alert internally |
| 429 / 5xx | No status change |

The middle two rows are worth distinguishing: a broken pool and a broken SA binding need different remediation instructions, and lumping them into one status makes the fix-it message unactionable.

---

## 4. Core Endpoints → Adapter Methods

Use the Google Cloud client libraries inside the adapter — same reasoning as [aws.md](./aws.md) §4.

### 4.1 Cloud Storage (`StorageAdapter`)

| Adapter method | HTTP | Path (`https://storage.googleapis.com/storage/v1`) |
|---|---|---|
| `listResources()` | `GET` | `/b?project=<project_id>` |
| `createResource()` | `POST` | `/b?project=<project_id>` |
| — get bucket | `GET` | `/b/{bucket}` |
| `deleteResource()` | `DELETE` | `/b/{bucket}` |
| — get/set IAM policy | `GET`/`PUT` | `/b/{bucket}/iam` |
| `getUsage()` | — | Cloud Monitoring API — see §6.3 |

### 4.2 Identity endpoints

| Purpose | Endpoint |
|---|---|
| Token exchange | `POST https://sts.googleapis.com/v1/token` |
| Impersonation | `POST https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/{email}:generateAccessToken` |

### 4.3 Minimum service account roles

| Role | For |
|---|---|
| `roles/storage.admin` | Bucket create/delete/configure |
| `roles/monitoring.viewer` | Usage metrics |

As with [aws.md](./aws.md) §4.3, **no object-level data access.** `roles/storage.admin` does include object permissions, so if a narrower posture matters to a customer, offer a custom role limited to bucket-level actions. Worth documenting in the connect UI as an option — security-conscious agencies will ask, and having the answer ready is the difference between a smooth onboarding and a stalled one.

### 4.4 Normalizing into `resources`

| `resources` column | GCP source |
|---|---|
| `provider_resource_id` | Bucket name (globally unique across all of GCP) |
| `type` | `object_storage` |
| `status` | Existence = `active`; buckets have no status field |
| `metadata` | `{ projectId, location, storageClass, versioning, uniformBucketLevelAccess }` |

---

## 5. Rate Limits & Errors

GCP applies per-API, per-project quotas. Bucket create/delete is rate-limited more aggressively than object operations. Client libraries retry with exponential backoff by default — keep it.

| GCP error | Normalized error |
|---|---|
| 401, `UNAUTHENTICATED` | `AdapterAuthError` |
| 403, `PERMISSION_DENIED` | `AdapterAuthError` |
| 404, `NOT_FOUND` | `AdapterNotFoundError` |
| 400, `INVALID_ARGUMENT` | `AdapterValidationError` |
| 409, `ALREADY_EXISTS` | `AdapterValidationError` — see §6.4 |
| 429, `RESOURCE_EXHAUSTED` | `AdapterRateLimitError` |
| 5xx, `UNAVAILABLE` | `AdapterUnknownError` |

---

## 6. Adapter Notes

### 6.1 Setup complexity is the real adoption barrier
AWS's flow is "create a role, paste the ARN." GCP's is "create a pool, add an OIDC provider with an attribute condition, create a service account, add an IAM binding, then give infyra four identifiers." That's a materially higher bar for a 2–20 person agency ([product.md](../product.md) §1's target customer).

Ship a **generated `gcloud` script or Terraform module** from `getTrustConfig()`, not a documentation page. Without it, expect either abandoned connection attempts or customers granting `roles/owner` to make the errors stop — the latter being strictly worse than not integrating at all.

### 6.2 Project number ≠ project ID
The WIF audience string uses the **project number** (numeric); most Storage API calls use the **project ID** (string). They are different values and mixing them produces confusing failures at connect time. Store both explicitly and name the fields unambiguously.

### 6.3 Usage data is a separate system
Like [aws.md](./aws.md) §6.3, there's no simple per-bucket cost endpoint. Cloud Monitoring gives storage bytes and request counts; billing data requires a BigQuery billing export the customer must enable.

**A BigQuery billing export is not a reasonable onboarding requirement.** So for [product.md](../product.md) §7's cost tracking, GCP follows the same approach as AWS: metrics plus infyra-side pricing calculation. Consistent across both hyperscalers, and it means the cost engine is one system, not per-provider.

### 6.4 Bucket names are globally unique
Same constraint as S3 ([aws.md](./aws.md) §6.4) — random suffix, store the real name. GCP has no `ClientToken` equivalent, so idempotency is the name-based pre-check with the stored name, plus the job-runner serialization from [README.md](./README.md#idempotency-support).

### 6.5 One connection = one GCP project
The audience string pins a specific project. An agency with multiple GCP projects needs multiple connections — which [product.md](../product.md) §4 already permits ("multiple connections per provider"). Make it explicit in the connect UI so agencies aren't surprised that connecting "their GCP" only reaches one project.

---

## 7. Documentation Links

| Topic | URL |
|---|---|
| Workload Identity Federation | https://cloud.google.com/iam/docs/workload-identity-federation |
| WIF with other providers (OIDC) | https://cloud.google.com/iam/docs/workload-identity-federation-with-other-providers |
| STS token exchange | https://cloud.google.com/iam/docs/reference/sts/rest/v1/TopLevel/token |
| `generateAccessToken` | https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateAccessToken |
| Cloud Storage JSON API | https://cloud.google.com/storage/docs/json_api/v1 |
