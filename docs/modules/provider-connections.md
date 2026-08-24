# Module: Provider Connections — Engineering Notes

Drill-down on product.md §4. This module *is* the adapter layer's product-facing surface — see [adapter-design.md](../adapter-design.md) for the underlying interface this module is built on top of, and [providers/](../providers/) for per-provider auth flows, endpoints, and token lifetimes.

---

## Build Notes

- **OAuth flow (Neon, Supabase)** is a standard authorize→consent→callback→token-exchange dance, but each provider's partner OAuth app needs to actually be registered and approved on their side before `getAuthUrl()`/`exchangeCode()` can be implemented for real — this is an external dependency, not just code, and should be kicked off early since provider approval turnaround is out of engineering's control.
- **API-key flow (Render)** is simpler code but worse UX — the user leaves infyra.cloud, generates a key manually, comes back and pastes it. `validateApiKey()` must give immediate, specific feedback (not just "invalid") since a pasted-wrong-key error is the most common failure mode here.
- **Health monitoring** needs a scheduled job (architecture.md open question #1) — not just a check-on-page-load, since product.md frames it as "periodic," and a stale status is worse than no status if an agency is about to provision against a revoked connection.

## Edge Cases to Design For

1. **Token expiry during a long-running operation.** If an OAuth token expires mid-provisioning-flow (e.g. `createDatabase()` in flight), does `refresh()` get attempted transparently, or does the operation fail and require a manual retry? Should be transparent where possible — refresh proactively per adapter-design.md §3.4, but the failure path still needs defined behavior.
2. **Revoking a connection with live resources.** product.md is explicit: "existing resources remain untouched on the provider side." But what happens to those `resources` rows in infyra.cloud — do they become read-only/orphaned, or fully hidden? Needs a decision; likely: status flips to reflect the connection is gone, resource stays visible for historical/billing purposes but is no longer actionable.
3. **Multiple connections to the same provider, ambiguous routing.** product.md allows this explicitly (§4). When provisioning a new resource, if a workspace has two Neon connections, does the UI force explicit selection every time, or is there a default? Needs a product decision, not just an engineering one.
4. **OAuth consent denied / callback error.** User starts the OAuth flow and cancels at the provider's consent screen — callback needs to handle the error case gracefully, not just the happy path.
5. **Provider-side rate limiting during health checks.** Periodic health checks across many workspaces could themselves trigger provider rate limits if not staggered — ties to architecture.md open question #4.

## Dependencies

- Requires Identity & Workspace (needs a workspace to attach a connection to, and Admin+ role check).
- Blocks Project & Resource Management entirely — no provisioning without a connection.
