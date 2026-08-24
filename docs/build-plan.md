# Build Plan — Architecture, Screens, and Sequence

The bridge between [tasks.md](./tasks.md) (what to build, by module) and actual code. Where tasks.md organizes by *module*, this doc organizes by *build order* — what has to exist before what, and what the UI looks like at each stage.

Read [product.md](./product.md) for the what and why. This is the how and when.

---

## 1. Where We Actually Are

Verified against the repo, not assumed:

| Layer | State |
|---|---|
| Monorepo, Turborepo, Biome, Husky | ✅ Working |
| `packages/db` — Drizzle + migrations wired | ✅ Auth tables only (`user`, `session`, `account`, `verification`) |
| `packages/auth` — Better Auth | ✅ Email/password + session |
| `apps/platform` — TanStack Router, file-based routes | ✅ Login, register, protected layout |
| TanStack Query + session hydration | ✅ `authSessionQueryOptions`, router context |
| `apps/server` — Hono | 🟡 **Auth handler only.** No workspace, no API routes |
| `packages/ui` — shadcn primitives | ✅ Button, input, sidebar, avatar, sheet, etc. |
| Sidebar components | 🟡 **shadcn boilerplate with hardcoded "Acme Inc" sample data** |
| Adapters, connections, projects, resources | ❌ Nothing |

**The honest summary:** auth is done, the shell is scaffolded but fake, and the entire product is unbuilt. That's a good place to be — the foundation is sound and nothing needs undoing.

---

## 2. The One Decision That Blocks Everything

Everything in this product hangs off **workspace**. It's the tenant unit ([product.md](./product.md) §3), the scope for every permission check, the owner of every connection, project, and resource, and the thing the session must resolve to on every request.

Right now `apps/server` has no concept of it, and `apps/platform`'s team switcher is hardcoded sample data.

```
                    ┌─────────────┐
                    │  WORKSPACE  │
                    └──────┬──────┘
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
  membership         connections           projects
  (user+role)        (credentials)        (client work)
       │                   │                   │
       │                   ▼                   ▼
       │              resources ◄────────  deploys
       │                   │
       ▼                   ▼
   audit log           usage/billing
```

**Nothing to the right of `workspace` can be built until workspace + membership + active-workspace resolution exists.** This is the true critical path, and it is Phase 0.

---

## 3. Build Sequence

Six phases. Each ends at a **demoable state** — something you can click through, not just a passing test suite.

### Phase 0 — Workspace Foundation
> *Demo: sign up, land in a real workspace, switch between two, invite a teammate.*

| # | Task | Where |
|---|---|---|
| 0.1 | `workspace`, `workspace_member` schema | `packages/db/src/schema/workspace.ts` |
| 0.2 | Create-workspace-on-signup hook | `packages/auth` |
| 0.3 | Workspace + role resolution middleware | `apps/server/src/middleware/workspace.ts` |
| 0.4 | `GET/POST /workspaces`, member routes | `apps/server/src/routes/workspaces.ts` |
| 0.5 | Permission checker from [permissions-matrix.md](./permissions-matrix.md) | `apps/server/src/lib/permissions.ts` |
| 0.6 | Wire `team-switcher.tsx` to real data | `apps/platform` |
| 0.7 | Typed API client + shared types | `packages/api-client` (new) |

**0.5 deserves emphasis.** Build the permission check as a **single table-driven function**, not scattered `if (role === "owner")` checks. [permissions-matrix.md](./permissions-matrix.md) is already an action→role matrix — encode it literally, as data:

```ts
can(role, "connection:create")   // → boolean
```

Every route declares the permission it needs. Adding a role later is a data change, not an audit of every handler.

---

### Phase 1 — First Adapter (Render)
> *Demo: paste a Render API key, see your real services listed in infyra.*

Per [tasks.md](./tasks.md), Render is first: `api_key` is the simplest auth lifecycle, so it proves the interface with the least incidental complexity.

| # | Task | Where |
|---|---|---|
| 1.1 | Credential encryption (KMS-backed) — **blocking, see [nfr.md](./nfr.md)** | `apps/server/src/lib/crypto.ts` |
| 1.2 | `ProviderAdapter` base + 5 normalized error types | `apps/server/src/adapters/types.ts` |
| 1.3 | Adapter registry | `apps/server/src/adapters/registry.ts` |
| 1.4 | Render adapter — `validateApiKey`, `checkHealth`, `listResources` | `apps/server/src/adapters/render/` |
| 1.5 | `provider_connection` schema + connection routes | db + server |
| 1.6 | Connect-provider UI (§5.3) | `apps/platform` |
| 1.7 | Connections list with status (§5.2) | `apps/platform` |

**Scope discipline:** Phase 1 is read-only. No provisioning, no deploys. The goal is proving the credential path end to end — encrypt, store, decrypt at call time, hit a real provider, normalize the response. Adding writes before that path is trusted just makes debugging harder.

---

### Phase 2 — Projects & Resources
> *Demo: create a project, link a real Render service to it, trigger a deploy, watch it go green.*

| # | Task | Where |
|---|---|---|
| 2.1 | `project`, `resource`, `deploy` schema | `packages/db` |
| 2.2 | `DeployAdapter` — `triggerDeploy`, `getDeployStatus`, `setEnvVars` | `apps/server/src/adapters/render/` |
| 2.3 | **Job runner** — [architecture.md](./architecture.md) open Q#1, now unavoidable | `apps/server/src/jobs/` |
| 2.4 | Deploy status polling ([providers/render.md](./providers/render.md) §6.3) | jobs |
| 2.5 | Scheduled health checks | jobs |
| 2.6 | Projects list + detail UI (§5.4, §5.5) | `apps/platform` |
| 2.7 | Env var editor (§5.6) | `apps/platform` |

**2.3 is the phase's real content.** The job runner has been deferred through two docs; Render deploys need polling ([providers/render.md](./providers/render.md) §6.3), so it stops being deferrable here. Decide it at the *start* of Phase 2, not when 2.4 gets stuck.

> Recommendation: start with an in-process scheduler + a `job` table for durability. A queue (BullMQ/Redis) is the right answer at scale but adds an infra dependency before there's load to justify it. The `job` table makes the migration path cheap.

---

### Phase 3 — Databases (Neon)
> *Demo: provision a real Postgres database and auto-inject its connection string into a Render service.*

| # | Task |
|---|---|
| 3.1 | Neon adapter via API key first ([providers/neon.md](./providers/neon.md) §6.1) |
| 3.2 | `DatabaseAdapter` — `createDatabase`, `getConnectionString` |
| 3.3 | Provisioning wizard UI (§5.7) |
| 3.4 | Connection-string auto-injection into linked deploy targets |
| 3.5 | OAuth flow + token refresh (**when Neon partner approval lands**) |

**3.4 is the product's first genuine "magic" moment** — the thing no single provider dashboard can do. It's worth polishing beyond the minimum.

Note the split: 3.1–3.4 need only an API key, so they are **not blocked** on Neon's partner approval. Start that registration during Phase 1 ([tasks.md](./tasks.md) external dependencies) and it should land around here.

---

### Phase 4 — Clients & Billing
> *Demo: attach a client to a project, generate an invoice with markup applied.*

`client`, `invoice`, cost aggregation from `getUsage()`, markup rules, Stripe, PDF generation, client portal (separate route namespace per [api-surface.md](./api-surface.md) §6).

This is the retention layer ([product.md](./product.md) §11) but depends on real usage data flowing, so it can't come earlier.

---

### Phase 5 — Observability & Polish
Unified dashboard, alerts, audit log write-path across all mutations, white-label branding.

**The audit log is the thing to be careful about here.** [product.md](./product.md) §3 wants it across every mutating action — retrofitting it in Phase 5 means touching every handler written in Phases 0–4. **Write the audit helper in Phase 0 and call it as you go**, even though the *viewer* UI is Phase 5.

---

## 4. Information Architecture

### Route map (`apps/platform`)

Current routing is TanStack file-based under `src/pages/`. Extending the existing `(protected)` group:

```
src/pages/
├── __root.tsx
├── auth/
│   ├── _layout.tsx              ✅ exists
│   ├── login.tsx                ✅ exists
│   └── register.tsx             ✅ exists
│
└── (protected)/
    ├── _layout.tsx              ✅ exists — becomes the sidebar shell
    ├── index.tsx                → Dashboard (overview)
    │
    ├── projects/
    │   ├── index.tsx            → Projects list
    │   ├── new.tsx              → Create project
    │   └── $projectId/
    │       ├── _layout.tsx      → Project shell w/ tabs
    │       ├── index.tsx        → Overview
    │       ├── resources.tsx    → Attached resources
    │       ├── deploys.tsx      → Deploy history
    │       ├── env.tsx          → Environment variables
    │       ├── domains.tsx      → Domains
    │       └── settings.tsx
    │
    ├── connections/
    │   ├── index.tsx            → Connections list
    │   └── new.tsx              → Connect a provider
    │
    ├── clients/                 → Phase 4
    ├── billing/                 → Phase 4
    │
    └── settings/
        ├── workspace.tsx
        ├── members.tsx
        ├── branding.tsx         → Phase 5
        └── audit.tsx            → Phase 5

src/pages/portal/                → Phase 4, separate auth namespace
```

**Why project detail is a nested layout with tabs:** a project spans resources, deploys, env vars, and domains — all scoped to one project. A nested `_layout.tsx` loads the project once and shares it, rather than each tab refetching. It also makes the URL honest: `/projects/abc/deploys` is bookmarkable and deep-linkable.

### Navigation model

Three tiers, and keeping them distinct is what stops the sidebar from becoming a junk drawer:

| Tier | Contains | Where |
|---|---|---|
| **Workspace** | Switcher, settings, members | Sidebar top + bottom |
| **Infrastructure** | Projects, Connections | Sidebar main |
| **Business** | Clients, Billing | Sidebar main, separate group |

---

## 5. UI / UX Design

Design principles for this specific product:

1. **Status is the primary information.** An agency opens this to answer "is anything broken?" — not to browse. Status belongs above the fold, everywhere.
2. **Provider identity stays visible.** Never hide which provider a resource lives on. The agency has the real account relationship ([product.md](./product.md) §11); obscuring it breaks their mental model.
3. **Destructive actions name the consequence.** "Delete database" must say what happens on the provider side.
4. **Never show a credential.** Not masked, not partial ([adapter-design.md](./adapter-design.md) §3.3).

---

### 5.1 App Shell

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────┐                                                       │
│ │ ◈ Acme Digital ▾ │  Projects  ›  Northwind Site                    ◐  ⌘K │
│ └──────────────────┘                                                       │
├──────────────────┬─────────────────────────────────────────────────────────┤
│                  │                                                         │
│  OVERVIEW        │                                                         │
│  ▸ Dashboard     │                                                         │
│                  │                                                         │
│  INFRASTRUCTURE  │                                                         │
│  ▾ Projects   12 │                  main content area                      │
│    · Northwind   │                                                         │
│    · Contoso     │                                                         │
│    · Fabrikam    │                                                         │
│  ▸ Connections 3 │                                                         │
│                  │                                                         │
│  BUSINESS        │                                                         │
│  ▸ Clients     8 │                                                         │
│  ▸ Billing       │                                                         │
│                  │                                                         │
├──────────────────┤                                                         │
│  ⚙ Settings      │                                                         │
│ ┌──────────────┐ │                                                         │
│ │ ◍ Bikram   ▾ │ │                                                         │
│ └──────────────┘ │                                                         │
└──────────────────┴─────────────────────────────────────────────────────────┘
```

Maps onto the existing shadcn sidebar components already scaffolded — `team-switcher.tsx` (top), `nav-main.tsx` (groups), `nav-user.tsx` (bottom). The work is replacing sample data with real queries, not rebuilding.

---

### 5.2 Dashboard — the "is anything broken?" screen

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                                                 │
│                                                                            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │ PROJECTS   │ │ RESOURCES  │ │ DEPLOYS 24h│ │ ATTENTION  │               │
│  │    12      │ │    28      │ │  17  ✓15 ✗2│ │     2  ▲   │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
│                                                                            │
│  ⚠  Needs attention                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ✗  Deploy failed · Contoso Landing            2h ago    [View logs]  │  │
│  │ ⟳  Connection needs reauth · Neon (personal)  1d ago    [Reconnect]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Recent activity                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ✓  Northwind Site      deployed  a3f21c9  main      4m ago   Bikram  │  │
│  │ ✓  Fabrikam API        deployed  7b1e004  main     22m ago   webhook │  │
│  │ ✗  Contoso Landing     failed    c9d8a12  main      2h ago   webhook │  │
│  │ ◆  Northwind DB        created   neon · us-east-1   5h ago   Bikram  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

**"Needs attention" only renders when non-empty.** A permanently-present empty state trains people to ignore the region — which defeats its purpose on the day it matters.

---

### 5.3 Connect a Provider

Step 1 — pick:

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Connect a provider                                          [Cancel]      │
│                                                                            │
│  DATABASES                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                  │
│  │  ◈  Neon                │  │  ◈  Supabase            │                  │
│  │     Serverless Postgres │  │     Postgres + auth     │                  │
│  │     OAuth        [Connect]  │     OAuth      [Connect]│                  │
│  └─────────────────────────┘  └─────────────────────────┘                  │
│                                                                            │
│  DEPLOYMENT                                                                │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                  │
│  │  ◈  Render              │  │  ◈  Vercel              │                  │
│  │     Services + Postgres │  │     Frontend hosting    │                  │
│  │     API key      [Connect]  │     Coming soon         │                  │
│  └─────────────────────────┘  └─────────────────────────┘                  │
└────────────────────────────────────────────────────────────────────────────┘
```

Step 2a — API key (Render):

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ← Connect Render                                                          │
│                                                                            │
│  1. Open Render → Account Settings → API Keys           [Open Render ↗]    │
│  2. Create a key and paste it below                                        │
│                                                                            │
│  API key                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ rnd_••••••••••••••••••••••••••••••                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Label (optional)                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Main Render account                                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│                                          [Cancel]  [Validate & connect]    │
└────────────────────────────────────────────────────────────────────────────┘
```

Step 3 — **workspace scoping, and this step is not optional:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ✓ Key validated                                                           │
│                                                                            │
│  This key can access 3 Render workspaces. Choose which ones infyra          │
│  may use — the others stay invisible to your team.                         │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☑  Acme Digital          14 services                                 │  │
│  │ ☐  Personal              3 services                                  │  │
│  │ ☐  Side Project Co       1 service                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│                                                    [Back]  [Finish]        │
└────────────────────────────────────────────────────────────────────────────┘
```

Per [providers/render.md](./providers/render.md) §6.2 — a Render key reaches every workspace the user belongs to. **Skipping this step silently exposes the user's personal and other-agency Render work to their whole team.** It's a data-exposure bug that looks like a feature, which is exactly why it must be a required step and not a settings toggle.

---

### 5.4 Connections List

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Connections                                          [+ Connect provider] │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ◈ Render      Main account                                           │  │
│  │   API key · 14 resources · scoped to Acme Digital                    │  │
│  │   ● Connected            checked 2m ago              [⋯]             │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ ◈ Neon        Personal                                               │  │
│  │   OAuth · 6 resources                                                │  │
│  │   ▲ Needs reauth         checked 1d ago   [Reconnect]  [⋯]           │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ ◈ Neon        Client tier                                            │  │
│  │   OAuth · 8 resources                                                │  │
│  │   ● Connected            checked 4m ago              [⋯]             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

Two Neon rows is deliberate — [product.md](./product.md) §4 explicitly allows multiple connections per provider, so the **label is what disambiguates them** and cannot be optional in practice. The status dot carries the four states from §4: `● Connected · ▲ Needs reauth · ✗ Revoked · ⊘ Invalid`.

---

### 5.5 Project Detail

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Northwind Site                                        ● Live   [Deploy]   │
│  Client: Northwind Traders · github.com/acme/northwind                     │
│                                                                            │
│  ┌ Overview ─┬ Resources ─┬ Deploys ─┬ Env vars ─┬ Domains ─┬ Settings ┐   │
│  └───────────┴────────────┴──────────┴───────────┴──────────┴──────────┘   │
│                                                                            │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ LATEST DEPLOY               │  │ RESOURCES                           │  │
│  │ ✓ Succeeded                 │  │ ◈ Render   web service      ● Live  │  │
│  │ a3f21c9 · main              │  │ ◈ Neon     postgres         ● Live  │  │
│  │ 4m ago · Bikram             │  │                                     │  │
│  │ [View logs]  [Rollback]     │  │ [+ Add resource]                    │  │
│  └─────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ DOMAINS                                                             │   │
│  │ northwind.com          ✓ verified    SSL ok                         │   │
│  │ www.northwind.com      ⟳ verifying   DNS pending                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

Provider badges (`◈ Render`, `◈ Neon`) appear on every resource — principle 2. The agency must always be able to answer "where does this actually live?"

---

### 5.6 Deploy History & Env Vars

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Deploys                                                    [Deploy now]   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ✓  a3f21c9  main   "fix: nav overflow"     4m ago   1m 12s  Bikram   │  │
│  │ ✗  c9d8a12  main   "feat: checkout"        2h ago     48s   webhook  │  │
│  │ ✓  7b1e004  main   "chore: deps"           5h ago   1m 30s  webhook  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ── expanded ──────────────────────────────────────────────────────────    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ✗  c9d8a12  main   "feat: checkout"    [Redeploy]  [Rollback to this] │ │
│  │ ┌──────────────────────────────────────────────────────────────────┐ │  │
│  │ │ 14:22:01  Building...                                            │ │  │
│  │ │ 14:22:31  ERROR  Cannot find module '@stripe/stripe-js'          │ │  │
│  │ │ 14:22:31  Build failed with exit code 1                          │ │  │
│  │ └──────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Environment variables                                                     │
│  ┌ Production ─┬ Preview ─┬ Development ┐              [+ Add variable]    │
│  └─────────────┴──────────┴─────────────┘                                  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ DATABASE_URL         ••••••••••••••••••  ◈ auto  [👁] [✎] [🗑]        │  │
│  │ STRIPE_SECRET_KEY    ••••••••••••••••••          [👁] [✎] [🗑]        │  │
│  │ NEXT_PUBLIC_API_URL  https://api.northwind.com    [👁] [✎] [🗑]        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ◈ auto — managed by infyra, injected from the linked Neon database.       │
│           Editing manually will be overwritten on next provision.          │
└────────────────────────────────────────────────────────────────────────────┘
```

The `◈ auto` marker matters: [product.md](./product.md) §6's auto-injection means infyra *owns* that value. Without a visible marker, a developer edits it, a reprovision silently reverts it, and they lose an afternoon.

> **Note on Render:** `setEnvVars()` is one API call per variable and is **not atomic** ([providers/render.md](./providers/render.md) §4.3). A partial failure must report which keys saved and which didn't — not a generic "failed" toast implying nothing was written.

---

### 5.7 Provision a Resource

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Add a resource to Northwind Site                            [Cancel]      │
│                                                                            │
│  What kind?                                                                │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐         │
│  │  ▣  Database      │ │  ▤  Web service   │ │  ▥  Static site   │         │
│  │     Postgres      │ │     Node, Docker  │ │     Built assets  │         │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘         │
│                                                                            │
│  ── Database selected ─────────────────────────────────────────────────    │
│                                                                            │
│  Provider          ┌────────────────────────────────────────────────────┐  │
│                    │ ◈ Neon · Client tier                            ▾  │  │
│                    └────────────────────────────────────────────────────┘  │
│  Region            ┌────────────────────────────────────────────────────┐  │
│                    │ US East (Ohio) · aws-us-east-2                  ▾  │  │
│                    └────────────────────────────────────────────────────┘  │
│                    ⚠ Region cannot be changed after creation.              │
│                                                                            │
│  ☑ Inject connection string into this project's Render service             │
│     as DATABASE_URL (production)                                           │
│                                                                            │
│                                            [Back]  [Create database]       │
└────────────────────────────────────────────────────────────────────────────┘
```

Two things this screen gets right, both traceable to provider research:

- **The region warning.** Neon pins region at creation, permanently ([providers/neon.md](./providers/neon.md) §6.3). Wrong region = delete and recreate, which for a database with data isn't recoverable. Warn *before*, not after.
- **The injection checkbox is the product's differentiator**, defaulted on. It's the step that replaces "copy connection string → open Render → paste into env vars."

**When the provider is Supabase**, this flow needs a gate: project creation returns before the database is usable ([providers/supabase.md](./providers/supabase.md) §6.5), so injection must wait for `ACTIVE_HEALTHY` rather than firing immediately.

---

### 5.8 Empty States

The first-run path determines whether an agency ever reaches value. Each empty state points at exactly one next action:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│                              ┌─────────┐                                   │
│                              │    ◈    │                                   │
│                              └─────────┘                                   │
│                                                                            │
│                      Connect your first provider                           │
│                                                                            │
│              infyra manages infrastructure that lives in your              │
│              own Neon, Supabase, and Render accounts. Connect              │
│              one to get started.                                           │
│                                                                            │
│                        [Connect a provider]                                │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

The copy states plainly that resources live in the agency's own accounts — reinforcing [product.md](./product.md) §11 ("infyra never becomes the infrastructure itself") at the moment they're deciding whether to trust it with credentials.

Chain: **no connections** → connect · **no projects** → create project · **project with no resources** → add resource.

---

## 6. Cross-Cutting UI Rules

| Rule | Why |
|---|---|
| Every mutation shows optimistic state, then reconciles | TanStack Query is already wired; deploys/provisioning are slow enough that spinners-only feels broken |
| Provider errors surface as the 5 normalized types | [adapter-design.md](./adapter-design.md) §2 — UI handles 5 cases, never provider-specific strings |
| Rate-limit errors say "try again in Ns" | Adapters carry reset timestamps ([providers/supabase.md](./providers/supabase.md) §5) — use them instead of a generic retry |
| Status is never inferred client-side | [architecture.md](./architecture.md) §4 "no simulated state" — render what the server stored |
| Destructive dialogs name the provider-side effect | "This deletes the database on Neon. Data cannot be recovered." |
| Long operations are resumable | Closing the tab mid-provision must not orphan a resource — job runner owns it, UI just observes |

---

## 7. What I'd Build This Week

If starting Monday, in order:

1. `workspace` + `workspace_member` schema, migration
2. Workspace resolution middleware in `apps/server`
3. `can(role, action)` from [permissions-matrix.md](./permissions-matrix.md)
4. `GET/POST /workspaces` + members routes
5. Replace `team-switcher.tsx` sample data with real queries
6. Audit-log helper (call it from day one, view it in Phase 5)

That's Phase 0, and it unblocks literally everything else.

**Two decisions to make before Phase 2 starts, not during:** the job runner ([architecture.md](./architecture.md) Q#1) and the KMS/encryption approach ([nfr.md](./nfr.md) §1). Both are flagged blocking in existing docs; neither has an owner yet.
