# Module: Observability — Engineering Notes

Drill-down on product.md §8. Explicitly scoped as "an aggregation layer over what providers already expose," not a custom metrics pipeline — worth holding the line on this scope during implementation, since "just add one more custom metric" pressure is exactly how an aggregation layer quietly becomes a bespoke monitoring product.

---

## Build Notes

- **Unified dashboard** pulls from each adapter's `getUsage()` / `checkHealth()` and deploy status — no new data collection, purely normalization + presentation over data the adapter layer already surfaces. This means Observability has almost no adapter work of its own; its engineering work is scheduling, caching, and normalization, not provider integration.
- **Polling cadence** needs to be decided per architecture.md §6 open question #1 (job runner). A reasonable default: connection health checks more frequently (minutes) than usage snapshots (less frequent — provider usage APIs are often not real-time anyway).
- **Alerts** (deploy failures, usage limits, domain/SSL expiry, connection health) — each has a different natural trigger:
  - Deploy failure: event-driven off the deploy status write (project-resource-management.md).
  - Usage approaching limits: needs a threshold check against `usage_snapshot` data — requires knowing the plan limit, which may itself need to come from the provider (not always exposed via API) or be manually configured per connection as a fallback.
  - Domain/SSL expiry: needs its own scheduled check, likely low-frequency (daily).
  - Connection health: reuses Provider Connections' health-check job output directly.

## Edge Cases to Design For

1. **Provider API doesn't expose a metric infyra.cloud wants to show.** Not every provider will have equivalent usage granularity (e.g. Neon's compute/storage metrics vs. Render's request/bandwidth metrics aren't the same shape). The normalized `usage_snapshot.metrics` jsonb needs to tolerate this gracefully — dashboard should show "not available" for a metric rather than a zero or error.
2. **Alert storm on a provider-wide outage.** If Neon has an incident affecting many workspaces at once, does each workspace get its own alert independently (correct per-tenant behavior) but does infyra.cloud's own job runner/notification system handle the fan-out without falling over? Worth a load consideration once alerting is built, not before.
3. **Usage limit thresholds without a known limit.** If a provider doesn't expose plan limits via API, "usage approaching plan limits" can't be computed automatically — needs either a manual limit-configuration fallback or explicit non-support for that provider's usage alerts.
4. **Stale data presented as current.** If a scheduled usage-snapshot job fails silently, the dashboard could show old data as if current. Every observability view should surface a "last updated" timestamp so staleness is visible rather than hidden — consistent with the no-simulated-state principle (product.md §11).

## Dependencies

- Fully downstream of Provider Connections and Project & Resource Management — has no independent data source.
- Feeds Client & Business Layer (billing needs usage data to compute costs).
