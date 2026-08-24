# Adapter Design — Deep Dive

Expands product.md §5. This is the single most load-bearing architectural decision in the product — every provider integration, every future partner (AWS/GCP/Azure), and the entire credential-isolation story depends on this contract being right. Treat changes to this interface as a breaking-change-tier decision, not a routine refactor.

**Per-provider implementation detail** — real endpoints, auth parameters, token TTLs, rate limits — lives in [providers/](./providers/), one doc per provider. This document defines the contract; those document what each adapter must call to satisfy it.

---

## 1. Design Goals (why this shape, not another one)

1. **Provider blast radius = 1 file.** If Render changes their API or revokes a partner relationship, exactly one adapter implementation is touched. Nothing in routing, permission checks, billing, or UI should import a provider SDK directly.
2. **Auth-type polymorphism without branching call sites.** OAuth and API-key providers must be callable through identical application code. The interface achieves this by making auth-type-specific methods part of the same base contract, populated or left unimplemented depending on `authType` — not by having callers branch on `if (provider.authType === 'oauth')`.
3. **Category-specific capability without a god interface.** `DatabaseAdapter` and `DeployAdapter` extend the base rather than the base interface growing a `createBranch()` that only Neon uses. Future categories (storage, CDN, email) get their own extension, not new optional fields bolted onto `ProviderAdapter`.
4. **Adapters are permission-blind.** Per product.md §10, all role/scope enforcement happens before an adapter method is ever called. An adapter method being invoked is proof the caller already had permission — the adapter does not re-check.

---

## 2. Interface Contract (restated with responsibilities)

```
ProviderAdapter (base — every provider implements this)
├── providerId: string              — stable identifier, e.g. "neon", "render"
├── category: "database" | "deploy" | "storage" | ...
├── authType: "oauth" | "api_key"
│
├── Connection lifecycle
│   ├── getAuthUrl(state)                    — OAuth only. Builds provider's authorize URL.
│   ├── exchangeCode(code)                   — OAuth only. code → { accessToken, refreshToken, expiresAt }.
│   ├── validateApiKey(key)                  — API-key only. Live check against provider before storage.
│   ├── checkHealth(credential)              — ALL providers. Returns Connected | NeedsReauth | Revoked | Invalid.
│   └── refresh(credential)                  — OAuth only, optional. Silent token refresh.
│
└── Resource operations
    ├── listResources(credential, scope)
    ├── createResource(credential, spec)     — spec is category-specific, validated by the adapter
    ├── deleteResource(credential, resourceId)
    └── getUsage(credential, resourceId)     — feeds Observability (product.md §8) and Billing (§7)

DatabaseAdapter extends ProviderAdapter
├── createDatabase(credential, spec) → normalized resource
├── createBranch(credential, databaseId, spec)   — optional; unimplemented adapters throw NotSupportedError
└── getConnectionString(credential, databaseId)  — returns a secret; caller is responsible for injection, not the adapter

DeployAdapter extends ProviderAdapter
├── linkRepo(credential, repoRef)
├── triggerDeploy(credential, projectId, ref)
├── getDeployStatus(credential, deployId)
└── setEnvVars(credential, projectId, vars, environment)
```

### Method contract rules
- **Never throw raw provider errors.** Every adapter method catches provider-SDK/HTTP errors and rethrows as one of a small set of normalized error types (`AdapterAuthError`, `AdapterRateLimitError`, `AdapterNotFoundError`, `AdapterValidationError`, `AdapterUnknownError`). Calling code (server routes, job runners) handles these five types, never provider-specific exceptions.
- **Optional methods fail loud, not silent.** `createBranch()` on an adapter that doesn't support branching throws `NotSupportedError` rather than being omitted — omission would produce a runtime `undefined is not a function` deep in a job runner instead of a clear capability check at the call site.
- **Idempotency where the provider allows it.** `createResource` / `createDatabase` should accept an idempotency key where the underlying provider API supports one (Neon and Render both do), so retried provisioning requests (e.g. after a timeout) don't create duplicate resources.

---

## 3. Credential Handling

This is the security-critical boundary and deserves its own explicit rules, expanding product.md §9b:

1. **At rest:** every credential (OAuth token pair or API key) is encrypted before it touches `packages/db`. Encryption key management is an infrastructure decision (KMS-backed, not a hardcoded app secret) — flagged as an open item in [architecture.md](./architecture.md) §6 if not already resolved elsewhere.
2. **In transit within the app:** a decrypted credential exists only inside the scope of the server request or job handler that needs it, passed as a function argument to the adapter method, never stored on a request-scoped object that outlives the call, never logged.
3. **Never reaches `apps/platform`.** Not even a masked/partial token. The dashboard shows connection *status* (Connected/Needs Reauth/Revoked/Invalid), never the credential material.
4. **Rotation:** OAuth `refresh()` is called proactively (before expiry, via a scheduled health-check job — see architecture.md open question #1) rather than reactively on a failed call, to avoid a user-facing failure during a provisioning action.

---

## 4. Connection-Level Scoping (product.md §4)

Render's API key is account-wide — the provider itself can't scope it to a subset of projects. infyra.cloud enforces scoping at the application layer instead:

- A `ProviderConnection` row has a workspace_id and, optionally, an allow-list of project_ids it may be used for.
- This check happens in the **server route layer**, not inside the adapter — consistent with the adapter-is-permission-blind principle in §1.4 above. The adapter receives a credential and a validated request; it has no concept of "is this connection allowed to touch this project."

---

## 5. Resource Normalization (product.md §5)

Single `resources` table, common columns + `metadata` JSON:

| Column | Notes |
|---|---|
| `id` | infyra-internal UUID |
| `workspace_id` | tenant scope |
| `project_id` | nullable — a resource can exist before being linked to a project during provisioning flow |
| `provider_connection_id` | which credential provisioned this |
| `type` | `database`, `web_service`, `static_site`, ... |
| `provider_resource_id` | the ID as known to the provider — required for every reconciliation call |
| `status` | normalized enum, mapped from provider-specific status strings by the adapter |
| `created_at`, `updated_at` | |
| `metadata` | JSON — provider-specific detail (e.g. Neon branch info, Render service plan) |

**Rule:** any field two or more current providers share gets promoted to a real column. Anything provider-specific stays in `metadata`. This keeps the promotion bar concrete instead of subjective — see also the anti-premature-abstraction principle in Section 7.

---

## 6. Adding a New Provider — Checklist

This is the concrete payoff of the design; it should be genuinely this short:

1. Implement `ProviderAdapter` (+ `DatabaseAdapter` or `DeployAdapter` as applicable) for the new provider in its own file.
2. Register it in the adapter registry (providerId → adapter instance/factory).
3. Add its OAuth app config or API-key validation endpoint to environment config (`packages/env`).
4. Add UI entries for "Connect a provider" (provider list, logo, auth-type-conditional form) — this is data-driven off the registry, not new UI logic per provider.
5. No changes to: permission checks, routing, the `resources` schema, billing aggregation, or observability normalization.

If step 5 stops being true for some future provider, that's a signal the interface has a gap — fix the interface, don't special-case around it.

---

## 7. Anti-Patterns to Avoid

- **Do not** let a provider-specific field leak into a shared type as an optional field "just for Neon." That's what `metadata` is for.
- **Do not** call a provider SDK from anywhere outside the adapter implementing it — including "just this one quick admin script."
- **Do not** add a fourth `authType` speculatively for AWS/GCP/Azure before there's a concrete partner integration to build against (product.md §4 explicitly frames these as designed-for, not built — the interface should accommodate them structurally without pre-building unused auth flows).
- **Do not** put retry/backoff logic in application code that calls adapters — retry policy for a given provider's flakiness characteristics belongs inside that provider's adapter.
