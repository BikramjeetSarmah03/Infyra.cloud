# API Surface — apps/server

Route inventory implied by [product.md](./product.md)'s modules. Grouped by module for cross-reference; not a final REST spec (verbs/paths are illustrative, framework is Hono per repo tooling).

Every route below is subject to two universal middleware layers, applied in this order:
1. **Session auth** (Better Auth) — resolves the calling user.
2. **Workspace + role check** (product.md §10) — resolves active workspace from session, checks role against the route's required permission, before any handler logic (and before any adapter call) runs.

---

## 1. Identity & Workspace

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/signup`, `/auth/login`, `/auth/logout` | Better Auth-backed; email/password |
| GET/POST | `/auth/oauth/github`, `/auth/oauth/google` | User login OAuth (§9a — distinct from provider OAuth) |
| GET | `/workspaces` | Workspaces the current user belongs to |
| POST | `/workspaces` | Create workspace |
| PATCH | `/workspaces/:id` | Name, region preference, notification prefs — Owner/Admin |
| POST | `/workspaces/:id/members/invite` | Email invite + role assignment — Owner/Admin |
| PATCH | `/workspaces/:id/members/:memberId` | Role change — Owner/Admin |
| DELETE | `/workspaces/:id/members/:memberId` | Remove member — Owner/Admin |
| GET | `/workspaces/:id/audit-log` | Paginated — Owner/Admin |

## 2. Provider Connections

| Method | Path | Notes |
|---|---|---|
| GET | `/connections` | List, with live-ish status (last health check) |
| GET | `/connections/:providerId/auth-url` | OAuth providers — kicks off getAuthUrl() |
| GET | `/connections/oauth/callback/:providerId` | exchangeCode(), stores encrypted credential |
| POST | `/connections/api-key` | API-key providers — validateApiKey() then store |
| POST | `/connections/:id/health-check` | Manual trigger of checkHealth() |
| DELETE | `/connections/:id` | Disconnect/revoke |
| POST | `/connections/:id/scope` | Set project allow-list for account-wide-key providers |

All connection-mutating routes require Admin+ (Developer cannot manage connections, per product.md §10).

## 3. Project & Resource Management

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/projects` | List / create |
| GET/PATCH/DELETE | `/projects/:id` | |
| POST | `/projects/:id/resources` | Provision — routes to adapter by resource type/provider |
| GET | `/projects/:id/resources` | List resources on a project |
| DELETE | `/resources/:id` | |
| POST | `/projects/:id/repo` | Link GitHub repo, select branch |
| POST | `/projects/:id/deploy` | Manual "deploy now" |
| POST | `/webhooks/github` | Push-triggered auto-deploy, signature-verified |
| GET | `/projects/:id/deploys` | Deploy history |
| GET | `/deploys/:id` | Status + logs |
| POST | `/deploys/:id/rollback` | |
| GET/PUT | `/projects/:id/env-vars` | Scoped by `?environment=` |
| POST | `/projects/:id/domains` | Attach + kick off verification |
| GET | `/projects/:id/domains/:domainId/status` | |

Deploy/env-var routes require Developer+ (matches product.md §10: "Deploy, edit environment variables, view logs").

## 4. Client & Business Layer

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/clients` | |
| GET/PATCH/DELETE | `/clients/:id` | |
| GET/PUT | `/workspaces/:id/branding` | Logo, theme, subdomain/custom domain — Owner/Admin |
| GET/POST | `/invoices` | |
| POST | `/invoices/:id/send` | |
| POST | `/billing/schedules` | Recurring billing setup |
| POST | `/billing/stripe/webhook` | Payment events, signature-verified |
| POST | `/clients/:id/portal-access` | Issue scoped client-viewer link |
| DELETE | `/clients/:id/portal-access/:accessId` | Revoke |

Billing routes require Owner or Billing-only role (product.md §10 — Billing-only "view/manage invoices and payment methods, no infrastructure access", so this role must be explicitly excluded from every non-billing route, not just excluded implicitly).

## 5. Observability

| Method | Path | Notes |
|---|---|---|
| GET | `/projects/:id/overview` | Unified deploy/uptime/usage view |
| GET | `/resources/:id/usage` | Normalized usage series |
| GET | `/alerts` | Workspace-scoped, filterable by type/status |
| PATCH | `/alerts/:id` | Acknowledge/resolve |

## 6. Client Portal (separate route namespace, distinct auth)

| Method | Path | Notes |
|---|---|---|
| GET | `/portal/:accessToken/project` | Read-only project status |
| GET | `/portal/:accessToken/deploys` | Read-only |
| GET | `/portal/:accessToken/usage` | Read-only |

This namespace deliberately does **not** share the workspace-session auth middleware — it authenticates by access token and hard-scopes every query to the single linked `project_id`, per product.md §10's Client-viewer definition. Keeping it a separate namespace (rather than reusing `/projects/:id/*` with a permission check) makes it structurally impossible for a client-viewer request to accidentally hit a route that wasn't scope-audited.

---

## Cross-Cutting Rule

No route handler calls a `ProviderAdapter` method directly from route-handling code without having first passed both middleware layers above. This is the API-layer half of the enforcement principle in product.md §10 ("the adapter layer has no awareness of permissions at all").
