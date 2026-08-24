# infyra.cloud — Product Document

**One dashboard for dev agencies to provision, deploy, brand, and bill their client projects — without juggling five provider consoles.**

---

## 1. Product Overview

infyra.cloud is a white-label control panel built for dev agencies and freelance developers who manage multiple client projects across databases, deploy targets, and hosting providers. It replaces the current default workflow — logging into Neon, Supabase, Render, and a spreadsheet separately for every client — with one branded dashboard that ties provisioning, project management, and client billing together.

**Who it's for:** Small to mid-sized dev agencies (2-20 people) and freelancers running Node/Next.js/API-based client work, who currently either juggle multiple provider dashboards manually or use cPanel-era reseller tools not built for their modern stack.

**What it is not:** A hyperscaler-competing cloud orchestrator, a hosting provider itself, or a generic multi-cloud IAM platform. infyra.cloud never runs client infrastructure directly — it orchestrates and brands access to infrastructure that lives on the underlying providers' own platforms.

---

## 2. Module Overview

| Module | Purpose |
|---|---|
| **Identity & Workspace** | Agency accounts, team roles, invites, audit trail |
| **Provider Connections** | Secure connection to Neon, Supabase, Render (and future providers) via OAuth or API key |
| **Project & Resource Management** | Client projects, database provisioning, deploys, environment variables, domains |
| **Client & Business Layer** | White-label branding, client records, billing & invoicing |
| **Observability** | Unified stats, deploy history, usage, alerts |

Each module is detailed below.

---

## 3. Module: Identity & Workspace

### Features
- **Sign up / login** — email + password, GitHub OAuth, Google OAuth
- **Workspace** — the core tenant unit; represents one agency. A user can belong to multiple workspaces (e.g. a freelancer working under two agency identities)
- **Team members & roles** — invite via email, assign a role at invite time (see Section 6: Permissions)
- **Workspace settings** — name, default region preferences, notification preferences
- **Audit log** — timestamped record of key actions (deploy triggered, connection added/removed, env var changed, client added, invoice sent, role changed)

### Out of scope for this module
SSO/SAML for enterprise workspaces — not needed at this tier of customer; revisit only if enterprise demand emerges.

---

## 4. Module: Provider Connections

The credential and trust layer underneath every other module. Built on an **adapter pattern** so each provider's integration is isolated, swappable, and independently maintainable — detailed fully in Section 5.

### Features
- **Connect a provider** — per-workspace, supports two connection types:
  - **OAuth** (Neon, Supabase) — standard authorize → consent → callback → token exchange, with refresh token handling
  - **API key** (Render, and other providers without a partner OAuth flow) — user pastes a key generated in the provider's own dashboard; validated live against the provider before being stored
- **Connection health monitoring** — periodic check confirms a stored credential is still valid; surfaces status as Connected / Needs Reauth / Revoked / Invalid
- **Multiple connections per provider** — a workspace may connect more than one Neon or Supabase account (e.g. separate accounts per region or client tier)
- **Disconnect / revoke** — removes the stored credential and blocks further provisioning through it; existing resources remain untouched on the provider side
- **Connection-level scoping (internal)** — even where a provider's own credential isn't scopable (e.g. Render's account-wide API key), infyra.cloud enforces which projects/clients that connection may be used for at the application layer

### Providers at launch
Neon, Supabase, Render.

### Providers designed for, not yet built
Vercel, Cloudflare, AWS S3, Cloudinary — the adapter interface already accounts for both OAuth-based and API-key-based providers, so these are additive, not architectural changes.

---

## 5. Adapter Design

The core architectural decision that makes multi-provider support maintainable rather than a growing pile of provider-specific spaghetti.

### Principle
Application code never talks to a provider's API directly. It talks to a common `ProviderAdapter` interface. Each provider gets one adapter implementing that interface; the app doesn't know or care which concrete provider it's calling.

### Interface shape

```
ProviderAdapter (base contract, every provider implements this)
├── providerId, category, authType
├── Connection lifecycle
│   ├── getAuthUrl()          — OAuth providers only
│   ├── exchangeCode()        — OAuth providers only
│   ├── validateApiKey()      — API-key providers only
│   ├── checkHealth()         — all providers
│   └── refresh()             — OAuth providers only, optional
└── Resource operations
    ├── listResources()
    ├── createResource()
    ├── deleteResource()
    └── getUsage()

DatabaseAdapter extends ProviderAdapter
├── createDatabase()
├── createBranch()            — optional, e.g. Neon-specific
└── getConnectionString()

DeployAdapter extends ProviderAdapter
├── linkRepo()
├── triggerDeploy()
├── getDeployStatus()
└── setEnvVars()
```

### What this buys the product
- **Adding a new provider = writing one adapter file + registering it.** No changes to routing, UI logic, permission checks, or the resource data model.
- **Provider-specific quirks stay contained.** Neon's branching model, Render's account-wide key scoping, Supabase's org/project hierarchy — each lives inside its own adapter and doesn't leak into shared code.
- **Mixed auth types are a first-class concept, not a special case.** OAuth and API-key providers are both just implementations of the same interface with different lifecycle methods populated.
- **Future partner-program providers (AWS/GCP/Azure) fit the same shape** as a third `authType` variant when/if they're built, without redesigning the interface.

### Resource normalization
Every provisioned resource — a Neon database, a Render web service — is stored in a single `resources` table with common fields (id, type, provider connection, status, created_at) plus a `metadata` field that holds whatever provider-specific detail doesn't generalize. This keeps cross-provider listing and dashboards simple while preserving full provider-specific detail when an adapter needs it back.

---

## 6. Module: Project & Resource Management

### Features
- **Projects** — the unit clients actually care about; one project represents one client site/app, optionally spanning multiple resources (e.g. one Render service + one Neon database)
- **Database provisioning** — create a database through a connected Neon or Supabase account directly from the dashboard; connection string retrievable and optionally auto-injected into a linked deploy project's environment variables
- **Deploy pipeline**
  - Connect a GitHub repository, select branch
  - Auto-deploy on push (webhook-based) or manual "deploy now"
  - Deploy history with status and logs
  - Rollback to a previous deploy
- **Environment variable management** — per project, per environment (production/staging/preview where supported by the provider)
- **Domain management** — attach and verify a custom domain per project, routed through the relevant deploy provider's own domain API

---

## 7. Module: Client & Business Layer

This is the layer that distinguishes infyra.cloud from a generic "connect your accounts" dashboard — it's built around how an agency actually runs client relationships, not just infrastructure.

### Features
- **White-label branding** — agency logo, color theme, custom subdomain (or full custom domain via CNAME), so the panel presents as the agency's own product to their clients
- **Client records** — name, contact info, linked projects, notes
- **Billing & invoicing**
  - Per-client cost tracking, with the agency's own markup applied on top of underlying provider costs
  - Invoice generation (PDF), recurring billing schedules
  - Payment collection via Stripe
- **Client portal (read-only)** — optional, scoped login for the agency's own client to view their project's status without seeing other clients, credentials, or the agency's other infrastructure

---

## 8. Module: Observability

### Features
- **Unified dashboard** — deploy status, uptime signals, and usage metrics pulled from each connected provider's own API and normalized into one consistent view (not a custom-built metrics pipeline — an aggregation layer over what providers already expose)
- **Alerts** — deploy failures, usage approaching plan limits, domain/SSL expiry, connection health issues
- **Deploy history** — full log and status trail per project, per deploy

---

## 9. Authentication Model

Two distinct authentication concerns exist in this product, and they're handled separately:

### 9a. User authentication (agency users logging into infyra.cloud)
- Email/password, GitHub OAuth, Google OAuth
- Session-based auth for the web app
- Workspace-scoped sessions — a logged-in user's active workspace determines what they see

### 9b. Provider authentication (infyra.cloud acting on a provider on the user's behalf)
Handled entirely through the adapter layer described in Section 5:

| Provider | Auth type | Flow |
|---|---|---|
| Neon | OAuth 2.0 | Authorize → consent → callback → access + refresh token stored encrypted |
| Supabase | OAuth 2.0 | Same shape as Neon |
| Render | API key | User generates key manually in Render dashboard, pastes into infyra.cloud, validated live before storage |

**Credential storage principle:** all provider credentials — OAuth tokens or API keys — are encrypted at rest, scoped to a single workspace, and never exposed to the frontend after initial capture. Adapters receive a decrypted credential only at call-time, server-side.

---

## 10. Permissions Model

### Roles (per workspace)

| Role | Can do |
|---|---|
| **Owner** | Everything — billing, workspace deletion, all projects, all connections |
| **Admin** | Manage projects, connections, and team members — no billing or workspace deletion |
| **Developer** | Deploy, edit environment variables, view logs — cannot manage provider connections or team |
| **Billing-only** | View/manage invoices and payment methods — no infrastructure access |
| **Client-viewer** | Read-only access scoped to a single project — for the agency's own client, not a team member |

### Enforcement principle
Role and scope checks happen at the application/API layer, before any request reaches a provider adapter. A Client-viewer's request for a project outside their scope is rejected before an adapter is ever invoked — the adapter layer has no awareness of permissions at all, keeping that logic in exactly one place.

---

## 11. Cross-Cutting Design Principles

These apply across every module above and are worth stating explicitly as product principles, not just implementation details:

- **Adapters isolate provider risk.** A provider changing their API, restricting their OAuth terms, or deprecating an integration affects one adapter, not the core product.
- **infyra.cloud never becomes the infrastructure itself.** It orchestrates and brands access to providers the agency (or their client) ultimately has the real account relationship with — the product's job is the workflow layer, not running servers.
- **Billing lock-in is the retention mechanism, not a side feature.** The dashboard aggregation is convenient; the billing and branding workflow is what makes switching away costly.
- **Every resource in the product traces back to a real provider resource.** Nothing is simulated or cached without a reconciliation path back to the provider's actual state.