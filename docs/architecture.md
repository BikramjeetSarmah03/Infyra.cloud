# infyra.cloud — System Architecture

Companion to [product.md](./product.md). This document describes how the product's modules map onto actual services, packages, and data flow. It reflects the current monorepo layout, not a proposed rewrite of it.

---

## 1. Repo Topology

```
infyra/
├── apps/
│   ├── server/       — API service (the brain: auth, adapters, provisioning, billing logic)
│   ├── platform/      — the agency-facing dashboard (control panel)
│   └── www/           — marketing site (Astro)
├── packages/
│   ├── auth/          — Better Auth config, shared server + client auth logic
│   ├── db/             — schema, migrations, query layer (Drizzle-style, per db:push/db:generate scripts)
│   ├── env/            — typed/validated environment variables, shared across apps
│   ├── ui/             — shared component library (shadcn-based) used by platform + www
│   └── config/         — shared tooling config (tsconfig, biome, etc.)
```

**Why this split works for this product specifically:**
- `apps/server` is where every provider adapter, credential decrypt, and billing computation lives. It is the only thing allowed to hold a decrypted provider credential (see [adapter-design.md](./adapter-design.md) §Credential Handling). Nothing in `platform` or `www` talks to Neon/Supabase/Render directly.
- `apps/platform` is a thin client: renders workspace state, calls `server`'s API, never embeds provider SDKs or provider secrets.
- `apps/www` is fully decoupled — marketing content has no runtime dependency on workspace data. Astro's static-first model is correct here since this surface doesn't need auth or live data.
- `packages/db` is the single source of truth for the `resources` table normalization described in product.md §5 — both provisioning writes and observability reads go through it, so there is one schema, not one per app.

---

## 2. Service Boundaries

### apps/server (API)
Owns, in order of trust sensitivity:
1. **Credential vault** — encrypt/decrypt of OAuth tokens and API keys (§9b of product.md). Decryption happens only inside a request handler, at call-time, and the decrypted value never leaves that request's memory.
2. **Adapter execution** — the only process that instantiates a `ProviderAdapter` and calls out to Neon/Supabase/Render.
3. **Permission enforcement** — role/scope checks (§10 of product.md) run here, before any adapter is touched.
4. **Billing computation** — cost aggregation, markup application, invoice generation trigger.
5. **Webhook ingestion** — GitHub push events (deploy trigger), Stripe payment events, provider status webhooks where available.

### apps/platform (dashboard)
- Session-authenticated SPA/SSR app (Better Auth client).
- Talks to `apps/server` exclusively over its API — no direct DB access, no provider SDKs.
- Renders workspace switcher, project list, connection status, billing views, and the client-viewer scoped read-only mode (§10, Client-viewer role).
- White-label rendering (custom subdomain/domain, agency branding) is resolved here based on request host — see [modules/client-business.md](./modules/client-business.md).

### apps/www (marketing)
- Public, unauthenticated. Astro content site. Out of scope for the rest of this document.

### packages/db
- Schema includes the normalized `resources` table (product.md §5), workspace/team/role tables, provider connection records (encrypted credential blobs), project records, client records, invoices, and audit log entries.
- Full entity list in [data-model.md](./data-model.md).

### packages/auth
- Better Auth configuration shared between `server` (session validation, OAuth callback handling for *user* login — GitHub/Google) and `platform` (client-side session hooks).
- **Important distinction to keep out of this package:** user authentication (Better Auth, §9a) and provider authentication (adapter OAuth/API-key flows, §9b) are architecturally separate. Better Auth handles how an agency user logs into infyra.cloud. It has no role in how infyra.cloud authenticates to Neon/Supabase/Render — that's adapter territory. Conflating the two in one package would undo the isolation product.md §5 is built around.

---

## 3. Request Flow Examples

### Example: provisioning a Neon database
```
platform (user clicks "Create Database")
  → server API: POST /projects/:id/resources
    → permission check (role + workspace scope)
    → load ProviderConnection for workspace, decrypt credential
    → DatabaseAdapter (Neon impl).createDatabase()
    → normalize response into resources table row
    → (optional) auto-inject connection string into linked deploy project's env vars
  ← response: normalized resource record
platform renders new resource
```

### Example: deploy triggered by GitHub push
```
GitHub webhook → server API: POST /webhooks/github
  → verify webhook signature
  → resolve repo → linked project → workspace
  → DeployAdapter (Render impl).triggerDeploy()
  → write deploy history row, status = "queued"
  → (async) poll or receive provider webhook for status updates
  → audit log entry: "deploy triggered"
```

### Example: client-viewer portal access
```
client (external, not a team member) logs into scoped portal URL
  → server validates Client-viewer role, single-project scope
  → all queries filtered to that project_id only
  → adapter layer never invoked directly by this path except via the same
    read-only resource/observability endpoints used by the main dashboard
```

---

## 4. Data Flow Principles (carried from product.md §11)

- **No simulated state.** Every row in `resources` must be reconcilable against the provider's real state via `getUsage()` / `checkHealth()`. If a provider call fails, the stored status reflects that — it does not silently stay "healthy."
- **Single writer to `resources`.** Only adapter-mediated operations write to this table. No manual/admin backdoor that creates a resource row without a matching provider-side object.
- **Server is the only credential holder.** `platform` never receives a decrypted token or API key, not even transiently — confirmed in product.md §9b ("never exposed to the frontend after initial capture").

---

## 5. Deployment Topology (not yet decided — flagged for follow-up)

product.md is explicit that infyra.cloud "never runs client infrastructure directly" — that principle covers what the *product* provisions for clients. It says nothing about where infyra.cloud's own services (`server`, `platform`, `www`, Postgres) run. Candidates worth evaluating when this becomes relevant: a single-region deployment on Render or Fly (dogfooding a category the product already touches), or Vercel for `platform`/`www` + a separate host for `server`. This is a deployment decision, not a product one — deferred until infra/DevOps planning, out of scope for this doc.

---

## 6. Open Architectural Questions

These are gaps between what product.md specifies and what an implementation needs to decide. Flagged here rather than silently assumed:

1. **Async job runner.** Deploy polling, connection health checks, usage aggregation, and invoice generation are background/recurring jobs. product.md doesn't specify a mechanism (cron, queue, worker). Needs a decision before Observability (§8) or Billing (§7) can be built.
2. **Webhook signature verification & idempotency.** GitHub and Stripe webhooks need replay protection and idempotent handling — not mentioned in product.md, but required for deploy triggers and payment collection to be correct.
3. **Multi-region provider support.** product.md mentions "region preferences" (§3, workspace settings) but doesn't specify how that constrains adapter behavior (e.g., does a Neon connection need to be region-pinned at creation time?).
4. **Rate limiting against provider APIs.** Adapters calling Neon/Supabase/Render on behalf of many workspaces need shared rate-limit awareness per provider connection, or one workspace's heavy usage could degrade another's.
