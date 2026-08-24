# Permissions Matrix

Expands product.md §10 from a role-description table into an action-level matrix — needed because "Admin manages projects, connections, and team members" doesn't by itself answer questions like "can Admin change billing markup?" This is the artifact the API layer's middleware (see [api-surface.md](./api-surface.md)) should be implemented against.

Legend: ✅ full access · 🔶 scoped/partial · ❌ no access

| Action | Owner | Admin | Developer | Billing-only | Client-viewer |
|---|---|---|---|---|---|
| **Workspace** |
| Delete workspace | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit workspace settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Team** |
| Invite / remove members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Provider Connections** |
| Add / remove connection | ✅ | ✅ | ❌ | ❌ | ❌ |
| View connection status | ✅ | ✅ | 🔶 (read-only) | ❌ | ❌ |
| **Projects & Resources** |
| Create / delete project | ✅ | ✅ | ❌ | ❌ | ❌ |
| Provision / delete resource | ✅ | ✅ | ❌ | ❌ | ❌ |
| Trigger deploy | ✅ | ✅ | ✅ | ❌ | ❌ |
| Rollback deploy | ✅ | ✅ | ✅ | ❌ | ❌ |
| View deploy logs | ✅ | ✅ | ✅ | ❌ | 🔶 (own project only) |
| Edit env vars | ✅ | ✅ | ✅ | ❌ | ❌ |
| View env vars (values) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage domains | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Clients** |
| Create / edit client record | ✅ | ✅ | ❌ | ❌ | ❌ |
| Issue / revoke portal access | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Billing** |
| View invoices | ✅ | 🔶 (read-only) | ❌ | ✅ | ❌ |
| Create / send invoices | ✅ | ❌ | ❌ | ✅ | ❌ |
| Set markup / billing schedule | ✅ | ❌ | ❌ | ✅ | ❌ |
| Manage payment methods | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Branding** |
| Edit white-label branding | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Observability** |
| View unified dashboard | ✅ | ✅ | ✅ | ❌ | 🔶 (own project only) |
| Manage alerts | ✅ | ✅ | 🔶 (ack only) | ❌ | ❌ |

### Notes / decisions this matrix forces that product.md left implicit
- **Admin + billing:** product.md says Admin has "no billing," which this matrix reads as *no write access*, but read access to invoices is likely still needed for an Admin doing project work to see if a client is overdue. Marked 🔶 — flagged for product confirmation before build, not assumed silently.
- **Developer + connections:** product.md says Developer "cannot manage provider connections" — read-only status visibility is assumed necessary (a Developer needs to know *why* a deploy is failing if a connection is revoked) but this should be confirmed, not assumed.
- **Client-viewer scope:** enforced by a structurally separate route namespace (see [api-surface.md](./api-surface.md) §6), not by a role check inside the main routes — so its 🔶 rows above are a different enforcement mechanism than every other row's, not just a narrower version of the same one.

### Enforcement location
Every row in this table is checked in `apps/server` middleware/route-handler code before an adapter is invoked, per product.md §10 and [adapter-design.md](./adapter-design.md) §1.4. This matrix should be kept in sync with whatever permission-check table/config actually ships — if they diverge, this doc is wrong, not a second source of truth.
