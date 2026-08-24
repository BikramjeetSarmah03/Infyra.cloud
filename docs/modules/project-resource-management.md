# Module: Project & Resource Management — Engineering Notes

Drill-down on product.md §6. The highest-surface-area module — spans provisioning, deploys, env vars, and domains.

---

## Build Notes

- **A project can span multiple resources** (product.md: "one Render service + one Neon database"). The data model (data-model.md §3) already supports this via `resource.project_id`, but the UI/UX needs to make this composition visible and manageable as one unit — e.g. deleting a project should prompt about what happens to its constituent resources, not silently orphan or silently cascade-delete them without confirmation.
- **Auto-injection of connection strings** (product.md §6) is a specific, valuable, and easy-to-get-wrong feature: provisioning a database and having its connection string land directly in a linked deploy project's env vars. This requires the provisioning flow to know about a "linked deploy project" concept at creation time, and needs to handle the case where no deploy project is linked yet (store the string, offer injection later) vs. already linked (inject immediately, trigger a redeploy or not?).
- **Deploy pipeline auto-deploy** is webhook-based (GitHub push → Render deploy). Needs webhook signature verification (nfr.md §1) and idempotent handling — GitHub can and will redeliver webhooks.
- **Rollback** (product.md §6) — need to confirm whether this is "redeploy a previous commit" (safe, always available) or relies on the provider's native rollback feature (Render has one; not all deploy providers will). The adapter's `DeployAdapter` should expose whichever is available and the UI should not assume both.

## Edge Cases to Design For

1. **Deploy triggered while a previous deploy is still running.** Queue it, reject it, or cancel-and-replace? Needs a decision — likely queue, but should be explicit rather than left to whatever the provider's own API happens to do by default.
2. **Env var change during an in-flight deploy.** Does the in-flight deploy pick up the new value or not? Should follow whatever the underlying provider does (usually: no, next deploy picks it up) rather than infyra.cloud trying to override that behavior.
3. **Database provisioning failure partway through.** If `createDatabase()` succeeds on the provider side but the subsequent normalize-and-store-in-`resources` step fails (network blip, app crash), you get an orphaned provider resource infyra.cloud doesn't know about. Needs a reconciliation job (architecture.md §6 open question) or at minimum a "resources we don't yet know if we own" recovery path.
4. **Domain verification failure/timeout.** DNS propagation can take a long time or never complete (misconfigured DNS on the client's side, outside infyra.cloud's control) — status needs a distinct "verification pending / stuck" state, not just binary verified/unverified, so the agency user isn't left guessing.
5. **Deleting a resource that's still referenced by env vars on another project** (e.g. a database's connection string was manually copied into another project's env var, outside the auto-injection flow). infyra.cloud has no way to know about this since it's opaque provider-side data — worth a warning in the UI ("this may be in use elsewhere") but not a hard block, since it's genuinely unknowable.

## Dependencies

- Requires Provider Connections (can't provision without a live connection).
- Feeds Observability directly (deploy history, resource status are observability's primary data source).
