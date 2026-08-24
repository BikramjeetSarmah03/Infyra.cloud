# Data Model

Entity breakdown implied by [product.md](./product.md), for `packages/db`. This is a planning-level model — field lists, not migration SQL. Types are indicative (Postgres-flavored, matching the `neon-postgres` stack already in use).

---

## 1. Identity & Workspace (product.md §3)

**workspace**
- id, name, slug (used for default subdomain), region_preference, notification_preferences (jsonb), created_at

**user**
- id, email, password_hash (nullable if OAuth-only), created_at
- (Better Auth likely owns most of this shape directly — see [modules/identity-workspace.md](./modules/identity-workspace.md))

**workspace_member**
- id, workspace_id, user_id, role (`owner` | `admin` | `developer` | `billing_only`), invited_at, joined_at, invited_by_user_id

**audit_log_entry**
- id, workspace_id, actor_user_id (nullable — system-triggered actions), action_type, target_type, target_id, metadata (jsonb), created_at
- action_type enum seeded directly from product.md §3: `deploy_triggered`, `connection_added`, `connection_removed`, `env_var_changed`, `client_added`, `invoice_sent`, `role_changed`

---

## 2. Provider Connections (product.md §4, §9b)

**provider_connection**
- id, workspace_id, provider_id (`neon` | `supabase` | `render`), auth_type (`oauth` | `api_key`)
- credential_encrypted (bytea/text — envelope-encrypted, never selected in a default query)
- status (`connected` | `needs_reauth` | `revoked` | `invalid`)
- last_health_check_at, created_at, created_by_user_id
- label (nullable — user-assigned, for disambiguating multiple connections to the same provider)
- **provider_account_id** (nullable) — the provider-side account/tenant scope resolved at connect time: Render `ownerId`, Vercel `teamId`, Cloudflare `account_id`, Supabase `organization_id`, Azure `tenant_id`. Promoted to a real column rather than living in per-adapter metadata because 3+ providers require it on nearly every call — clears the promotion bar in [adapter-design.md](./adapter-design.md) §5. See [providers/cloudflare.md](./providers/cloudflare.md) §6.3.
- **credential_expires_at** (nullable) — known expiry where the provider exposes one (Cloudflare tokens with a user-set TTL, Supabase PATs). Enables warning *before* expiry instead of reporting a dead connection after ([providers/cloudflare.md](./providers/cloudflare.md) §3).

**provider_connection_scope**
- id, provider_connection_id, project_id
- Only populated when a connection needs application-layer scoping (e.g. Render's account-wide key) — see [adapter-design.md](./adapter-design.md) §4. Absence of rows for a connection means "unscoped, usable workspace-wide."

---

## 3. Project & Resource Management (product.md §6)

**project**
- id, workspace_id, client_id (nullable), name, created_at
- Represents the client-facing unit — "one client site/app" per product.md.

**resource**
- Full shape defined in [adapter-design.md](./adapter-design.md) §5 — reproduced here for schema completeness:
- id, workspace_id, project_id (nullable), provider_connection_id, type, provider_resource_id, status, metadata (jsonb), created_at, updated_at

**deploy**
- id, project_id, resource_id (the deploy-target resource), triggered_by (`push` | `manual`), triggered_by_user_id (nullable if webhook), git_ref, status, started_at, finished_at
- (`getDeployStatus` from the adapter writes into this row)

**deploy_log_chunk** *(or external log storage reference)*
- id, deploy_id, sequence, content, created_at
- Flagged: raw log volume may argue for object storage + a pointer here rather than DB rows at scale — a build-time decision, not a product one.

**env_var**
- id, project_id, environment (`production` | `staging` | `preview`), key, value_encrypted, updated_at, updated_by_user_id
- Encrypted at rest for the same reason provider credentials are — these often *are* provider credentials (e.g. injected DB connection strings, per product.md §6).

**domain**
- id, project_id, hostname, verification_status, verified_at, provider_connection_id (which deploy provider's domain API owns this)

---

## 4. Client & Business Layer (product.md §7)

**client**
- id, workspace_id, name, contact_email, contact_phone (nullable), notes (text), created_at

**branding_config**
- id, workspace_id, logo_url, color_theme (jsonb), subdomain, custom_domain (nullable), custom_domain_verified (bool)
- One-to-one with workspace; split into its own table rather than columns on `workspace` because it's read on every white-labeled page load and has a distinct write pattern (rare) from workspace core fields.

**invoice**
- id, workspace_id, client_id, status (`draft` | `sent` | `paid` | `overdue` | `void`), amount_underlying (provider cost), amount_billed (with markup), currency, period_start, period_end, pdf_url, stripe_invoice_id (nullable), created_at

**recurring_billing_schedule**
- id, workspace_id, client_id, cadence (`monthly` | ...), markup_type (`percent` | `flat`), markup_value, next_run_at

**client_portal_access**
- id, client_id, project_id, access_token_hash, role fixed to `client_viewer`, created_at, revoked_at (nullable)
- Deliberately not a `workspace_member` row — client-viewers are explicitly "not a team member" per product.md §10, and mixing them into the same table risks a permission-check bug that grants workspace-wide access by accident.

---

## 5. Observability (product.md §8)

**usage_snapshot**
- id, resource_id, captured_at, metrics (jsonb — normalized shape per resource type)
- Populated by `getUsage()` adapter calls on a schedule (see architecture.md §6 open question on job runner).

**alert**
- id, workspace_id, type (`deploy_failure` | `usage_limit` | `domain_expiry` | `connection_health`), target_type, target_id, severity, status (`open` | `acknowledged` | `resolved`), created_at, resolved_at

---

## 6. Cross-Cutting Notes

- **Tenant isolation:** every table except `user` carries a `workspace_id` (directly or via a parent FK). Every query in `apps/server` must filter on it — this is the actual enforcement mechanism behind product.md §10's "role and scope checks happen at the application/API layer."
- **Soft vs. hard delete:** connections use status transitions (`revoked`), not row deletion, so audit history and billing records referencing them remain valid — consistent with product.md §4 ("existing resources remain untouched on the provider side" on disconnect).
- **No orphaned resources:** `resource.provider_connection_id` should be `ON DELETE RESTRICT`, not cascade — a connection can't be hard-deleted while resources still reference it, forcing the revoke-not-delete pattern above.
