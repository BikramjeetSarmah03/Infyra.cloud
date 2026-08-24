# Tasks & Roadmap

Organized by module (mirroring [product.md](./product.md)'s structure), each broken into phases. This is a planning artifact for sequencing — not a sprint board. Cross-references the per-module deep-dive docs in [modules/](./modules/) for the reasoning behind each item.

**Phase definitions:**
- **MVP** — the minimum that lets one agency run one real client through the product end to end.
- **V1** — rounds out the module to match product.md's full spec.
- **V2** — extensions beyond product.md's current scope (future providers, deferred features).

---

## Foundation (blocks all modules — build first)

- [ ] Monorepo scaffolding, shared tsconfig/biome config — **already done** (`packages/config`, root configs in place)
- [ ] `packages/env` — typed env validation — **already scaffolded**, needs actual variable schema per module as they're built
- [ ] `packages/db` — base schema tooling (Drizzle push/generate/migrate scripts already wired in root `package.json`) — needs the actual schema from [data-model.md](./data-model.md)
- [ ] Job runner / scheduler decision (architecture.md §6, open question #1) — **blocking decision**, needed before Provider Connections health checks or Observability can be built
- [ ] Encryption/KMS setup for credential storage (nfr.md §1) — **blocking decision**, needed before any provider credential can be stored

---

## Module: Identity & Workspace

*See [modules/identity-workspace.md](./modules/identity-workspace.md) for edge cases.*

### MVP
- [ ] Better Auth setup — email/password + session handling (`packages/auth`)
- [ ] Workspace model + create-workspace flow
- [ ] Workspace membership + role assignment (schema + invite-by-email)
- [ ] Active-workspace resolution middleware (session → workspace → role, on every request)

### V1
- [ ] GitHub OAuth, Google OAuth login
- [ ] Multi-workspace switcher UI
- [ ] Audit log — write path wired into every mutating action across all modules
- [ ] Workspace settings (region preference, notification preferences)
- [ ] Last-Owner-removal guard

### V2
- [ ] SSO/SAML — explicitly deferred per product.md §3, revisit only on enterprise demand

---

## Module: Provider Connections

*See [modules/provider-connections.md](./modules/provider-connections.md) and [adapter-design.md](./adapter-design.md). Per-provider endpoints, auth params, and token TTLs: [providers/](./providers/).*

### External dependencies — start before the code
- [ ] **Neon OAuth app registration** — partner approval, turnaround outside our control ([providers/neon.md](./providers/neon.md) §1). Interim: build against an API key ([providers/neon.md](./providers/neon.md) §6.1)
- [ ] **Supabase OAuth app registration** — note scopes are fixed at registration and widening them later forces re-consent on every existing connection ([providers/supabase.md](./providers/supabase.md) §2.1)

### MVP
- [ ] `ProviderAdapter` base interface + normalized error types (adapter-design.md §2)
- [ ] Render adapter (API-key — simplest auth type, good first adapter to prove the interface)
- [ ] API-key connect flow: paste key → `validateApiKey()` → encrypted storage
- [ ] Connection list + status display (Connected/Invalid at minimum)

### V1
- [ ] Neon adapter (OAuth + `DatabaseAdapter` — proves the interface's second auth type and second category)
- [ ] Supabase adapter
- [ ] OAuth connect flow: authorize → callback → token exchange
- [ ] Scheduled health-check job (Connected/Needs Reauth/Revoked/Invalid, all four states live)
- [ ] Token refresh handling
- [ ] Multiple connections per provider
- [ ] Disconnect/revoke flow
- [ ] Connection-level scoping (project allow-list) for account-wide-key providers

### V2
- [ ] Vercel, Cloudflare, AWS S3, Cloudinary adapters (product.md §4 — "designed for, not yet built") — see [providers/vercel.md](./providers/vercel.md), [providers/cloudflare.md](./providers/cloudflare.md), [providers/aws.md](./providers/aws.md)
- [ ] AWS/GCP/Azure `cloud_role` `authType` variant (adapter-design.md §6 — only when a concrete partner integration exists). All three fit **one** variant, not three — see [providers/README.md](./providers/README.md#the-fourth-authtype)
- [ ] `StorageAdapter` category interface — define when the *second* storage provider is built, not around S3 alone ([providers/aws.md](./providers/aws.md) §6.1)
- [ ] **infyra OIDC issuer** — hard prerequisite for GCP WIF ([providers/gcp.md](./providers/gcp.md) §2.4) and for removing infyra's long-lived Azure app secret ([providers/azure.md](./providers/azure.md) §6.2). One build serves both
- [ ] DNS as a cross-cutting capability, not a `ProviderAdapter` category — resolve before Cloudflare is built ([providers/cloudflare.md](./providers/cloudflare.md) §6.1)

---

## Module: Project & Resource Management

*See [modules/project-resource-management.md](./modules/project-resource-management.md).*

### MVP
- [ ] Project CRUD
- [ ] `resources` table + normalization write path (adapter-design.md §5)
- [ ] Database provisioning through one adapter (Neon or Render depending on which lands first)
- [ ] Manual "deploy now" through Render adapter
- [ ] Env var management (single environment first)

### V1
- [ ] GitHub repo linking + webhook-based auto-deploy
- [ ] Deploy history with status + logs
- [ ] Rollback
- [ ] Multi-environment env vars (production/staging/preview)
- [ ] Connection-string auto-injection into linked deploy project
- [ ] Domain attach + verification

### V2
- [ ] Deploy queueing/concurrency handling refinement (edge case #1 in module doc)
- [ ] Orphaned-resource reconciliation job (edge case #3 in module doc)

---

## Module: Client & Business Layer

*See [modules/client-business.md](./modules/client-business.md).*

### MVP
- [ ] Client records (CRUD)
- [ ] Basic white-label branding (logo, color theme) — subdomain only, no custom domain yet
- [ ] Manual invoice creation (no automation yet)

### V1
- [ ] Custom domain via CNAME for branding
- [ ] Per-client cost tracking with markup
- [ ] Automated invoice generation (PDF) + recurring billing schedules
- [ ] Stripe payment collection integration
- [ ] Client portal (scoped read-only access, separate route namespace per api-surface.md §6)

### V2
- [ ] Workspace-default markup with per-client overrides (if confirmed needed — see module doc edge case #3)
- [ ] Multi-currency support (if confirmed needed — see module doc edge case #5)

---

## Module: Observability

*See [modules/observability.md](./modules/observability.md).*

### MVP
- [ ] Basic project overview (deploy status + resource status, no historical usage yet)

### V1
- [ ] Usage snapshot collection job + normalized storage
- [ ] Unified dashboard (deploy, uptime signals, usage in one view)
- [ ] Alerts: deploy failures, connection health issues
- [ ] Full deploy history/log trail

### V2
- [ ] Alerts: usage approaching plan limits (depends on provider limit data availability — module doc edge case #3)
- [ ] Alerts: domain/SSL expiry

---

## Suggested Build Order (cross-module)

Given the dependency chains noted in each module doc:

1. **Foundation** (job runner decision, encryption setup)
2. **Identity & Workspace MVP** (everything needs auth + workspace + roles first)
3. **Provider Connections MVP** (Render adapter — simplest, proves the pattern)
4. **Project & Resource Management MVP** (first real end-to-end: connect → provision → deploy)
5. **Observability MVP** (thin — mostly just surfacing what's already being written)
6. **Client & Business Layer MVP** (can start in parallel with #4/#5 since client records don't depend on provisioning)
7. Iterate each module to V1 — Neon/Supabase adapters unlock the "database provisioning" half of the product story that Render alone doesn't cover
8. V2 items — driven by actual usage/demand, not pre-built speculatively (consistent with product.md §4's "additive, not architectural" framing for future providers)
