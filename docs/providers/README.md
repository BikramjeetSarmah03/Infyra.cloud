# Provider Integration Reference

Per-provider integration detail for every provider infyra.cloud connects to — real endpoints, auth flows, required parameters, token lifetimes, and rate limits.

**Relationship to the other docs:**
- [product.md](../product.md) §4 defines *which* providers and *why*.
- [adapter-design.md](../adapter-design.md) defines the `ProviderAdapter` contract every doc here implements against.
- [modules/provider-connections.md](../modules/provider-connections.md) covers the product-facing connection lifecycle.
- **These docs** are the implementation substrate: what each adapter file actually has to call.

Every doc here follows the same section order, so an adapter author can diff two providers quickly.

---

## Provider Status Matrix

| Provider | Category | Auth type | Status | Doc |
|---|---|---|---|---|
| **Neon** | database | OAuth 2.0 + PKCE | Launch (V1) | [neon.md](./neon.md) |
| **Supabase** | database | OAuth 2.0 + PKCE | Launch (V1) | [supabase.md](./supabase.md) |
| **Render** | deploy + database | API key | Launch (MVP) | [render.md](./render.md) |
| **Vercel** | deploy | OAuth 2.0 (integration) | Designed for, not built | [vercel.md](./vercel.md) |
| **Cloudflare** | deploy + storage + dns | API token | Designed for, not built | [cloudflare.md](./cloudflare.md) |
| **AWS** | storage + compute | `cloud_role` (AssumeRole) | Designed for, not built | [aws.md](./aws.md) |
| **GCP** | storage + compute | `cloud_role` (WIF) | Designed for, not built | [gcp.md](./gcp.md) |
| **Azure** | storage + compute | `cloud_role` (service principal) | Designed for, not built | [azure.md](./azure.md) |

---

## The Fourth `authType`

[adapter-design.md](../adapter-design.md) §7 says not to add a fourth `authType` speculatively. These docs do **not** change that — they establish that when AWS/GCP/Azure are actually built, all three fit **one** new variant, not three:

| | AWS | GCP | Azure |
|---|---|---|---|
| Customer creates | IAM Role | WIF pool + SA binding | App registration / service principal |
| infyra presents | Its own AWS account ID + per-workspace `ExternalId` | Its own OIDC token | Its own client credential |
| infyra receives | STS temp credentials | Short-lived OAuth token | Short-lived OAuth token |
| Stored at rest | Role ARN + external ID (**not** a secret) | Pool/provider/SA resource names | Tenant ID + client ID + app secret |
| Credential TTL | 15 min – 12 h | ~1 h | ~1 h |

The shared shape: **infyra stores a durable *reference* to a customer-side trust grant, and mints a short-lived credential per call.** That's structurally different from both `oauth` (store a refresh token) and `api_key` (store the secret itself), and it's why it needs its own variant rather than being crammed into either.

Call it `cloud_role`. It adds two adapter methods:

```
getTrustConfig(workspaceId)     — returns what the customer must create on their side
                                  (infyra's account ID, the external ID, required permissions)
assumeCredential(connection)    — mints the short-lived credential; called per-operation,
                                  result never cached beyond its TTL
```

`checkHealth()` for a `cloud_role` connection is just `assumeCredential()` succeeding.

---

## Cross-Provider Concerns

### Credential storage by auth type

Per [data-model.md](../data-model.md), `provider_connection.credential_encrypted` holds different shapes per auth type. All are envelope-encrypted regardless — including the AWS one, which contains no secret, purely for uniformity of the read path.

| authType | Encrypted blob contains |
|---|---|
| `oauth` | `{ accessToken, refreshToken, expiresAt, scope }` |
| `api_key` | `{ apiKey }` |
| `cloud_role` | `{ roleArn, externalId }` / `{ audience, serviceAccount }` / `{ tenantId, clientId, clientSecret }` |

### Rate limits at a glance

Feeds [architecture.md](../architecture.md) open question #4 — these are the real numbers to build the shared limiter against.

| Provider | Documented limit | Notes |
|---|---|---|
| Supabase | 120 req/min per user/scope | Analytics + database endpoints far stricter: 10–30 req/min |
| Cloudflare | 1200 req/5 min per user | Account-wide, not per-token |
| Vercel | Varies per endpoint class | Returns `X-RateLimit-*` headers |
| Neon | Not publicly documented | Treat as unknown; back off on 429 |
| Render | Not publicly documented | Treat as unknown; back off on 429 |
| AWS/GCP/Azure | Per-service, varies widely | Control-plane calls are the constrained ones |

**Design rule:** because two of five launch-relevant providers don't publish a number, the limiter cannot be configured from documented limits alone. Build it adaptive — respect `Retry-After` and `X-RateLimit-Reset` where present, and apply a conservative default bucket per `provider_connection_id` where absent.

### Health check → status mapping

Every adapter's `checkHealth()` must map into the four states in [product.md](../product.md) §4. The mapping is provider-specific but the *decision rule* is shared:

| Provider signal | infyra status |
|---|---|
| Call succeeds | `connected` |
| 401 + refresh token present and usable | attempt refresh → then re-evaluate |
| 401 + refresh fails or no refresh token | `needs_reauth` |
| 401/403 + provider says grant was revoked | `revoked` |
| 400/404 on identity, malformed credential | `invalid` |
| 429 or 5xx | **no status change** — this is provider unavailability, not credential failure |

That last row is the one most likely to be got wrong. A rate-limited health check that flips a working connection to `invalid` would show agencies a broken connection that isn't broken — and per [modules/provider-connections.md](../modules/provider-connections.md), a wrong status is worse than a stale one.

### Idempotency support

[adapter-design.md](../adapter-design.md) §2 requires idempotency keys "where the underlying provider API supports one." Actual support is thinner than that phrasing implies:

| Provider | Native idempotency | Fallback |
|---|---|---|
| AWS | Yes (`ClientToken` on most create calls) | — |
| Vercel | Partial | Name-based pre-check |
| Neon | No documented key | Pre-check by name before create |
| Supabase | No documented key | Pre-check by name before create |
| Render | No documented key | Pre-check by name before create |
| Cloudflare | No documented key | Pre-check by name before create |

**So the fallback is the common path, not the exception.** Each adapter that lacks native support implements: list-by-name → if exists and was created by this workspace, return it → else create. This is not perfectly race-free; a same-name collision from two concurrent requests is possible. Serialize provisioning per `(workspace_id, provider_connection_id)` at the job-runner level to close that gap.

---

## Adding a Provider Doc

Match the section order used by every file here:

1. **At a Glance** — table: base URL, auth type, category, adapter interface
2. **Authentication** — full flow with real endpoints and parameters
3. **Token Lifetime & Refresh** — TTLs, rotation, revocation detection
4. **Core Endpoints** — mapped to `ProviderAdapter` methods
5. **Rate Limits & Errors** — including the normalized-error mapping table
6. **Adapter Notes** — quirks, gotchas, decisions this provider forces
7. **Documentation Links** — canonical sources

Section 6 is the one that earns the doc. Sections 1–5 are transcribed from provider docs and go stale; section 6 is the reasoning that doesn't exist anywhere else.
