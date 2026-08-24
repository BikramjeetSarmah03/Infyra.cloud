# Non-Functional Requirements

product.md specifies *what* the product does. This doc specifies the operating characteristics an implementation must hit — the things that don't show up in a feature list but determine whether the product is trustworthy enough for an agency to put their client billing relationship through it.

---

## 1. Security

- **Credential encryption at rest** is not optional and not deferrable — product.md §9b states it as a principle, treat it as a launch blocker, not a hardening pass. Encryption key managed via KMS or equivalent, never a static app-level secret checked into config.
- **No credential in logs.** Adapter error handling (adapter-design.md §2) must guarantee provider credentials never appear in stack traces, error messages, or structured logs — a common leak vector when provider SDKs throw errors that embed the request they made.
- **Webhook signature verification** mandatory on both GitHub (deploy triggers) and Stripe (payment events) before any handler logic runs — an unverified webhook accepting "deploy succeeded" or "payment received" is a direct path to billing fraud or supply-chain injection.
- **Tenant isolation is the top security invariant.** Every DB query scoped by `workspace_id` (data-model.md §6). A cross-workspace data leak here isn't a bug class, it's the failure of the entire "one dashboard, many clients" trust model the product sells.
- **Client-portal token scope.** Portal access tokens (data-model.md §4) must be unguessable, individually revocable, and scoped to exactly one project at issuance — not filterable-to-one-project after the fact.

## 2. Reliability

- **Provider outages must degrade, not cascade.** If Neon's API is down, that should surface as "Neon: degraded" on affected resources — it must not take down auth, billing views, or resources belonging to other providers. This is a direct consequence of the adapter isolation principle (product.md §11) and should be treated as testable, not just architecturally implied.
- **Idempotent provisioning.** A retried "create database" request (client-side double-click, network timeout + retry) must not create two databases. See adapter-design.md §2 on idempotency keys.
- **Deploy status must reconcile, not just cache.** If infyra.cloud's stored deploy status and the provider's actual status diverge (missed webhook, crashed job), a reconciliation job should catch and correct it — consistent with product.md §11 ("nothing is simulated or cached without a reconciliation path").

## 3. Data Integrity (billing-specific)

- **Invoice generation must be deterministic and re-runnable without double-billing.** Given the same underlying provider usage data, regenerating an invoice for a closed period should produce the same output, and a schedule re-run must not create a duplicate invoice.
- **Markup calculation must be auditable.** Every invoice should be traceable back to the underlying provider cost + markup rule applied, not just a final number — an agency will get billing disputes from their own clients and needs to be able to answer "why is this $47."

## 4. Performance / Scale (directional, not final targets)

- Dashboard aggregation (Observability, product.md §8) pulls from multiple provider APIs per page load — needs caching/snapshotting (see data-model.md §5 `usage_snapshot`) so a slow provider API doesn't block the whole dashboard render.
- Target tenant scale per product.md §1 ("2-20 people" agencies, "multiple client projects") implies tens to low hundreds of projects per workspace, not thousands — informs whether naive per-request provider polling is acceptable at launch vs. requiring a dedicated caching layer immediately.

## 5. Auditability

- Every action listed in product.md §3's audit log spec must be genuinely non-repudiable — written at the point of action, not reconstructed after the fact, and immutable (append-only, no update/delete path from the application layer).

## 6. Availability of infyra.cloud itself

- Since infyra.cloud brands itself as the client-facing surface for its agency customers (white-label, product.md §7), an outage isn't just an inconvenience for the agency — it's an outage of *their* product in front of *their* clients. This raises the bar on infyra.cloud's own uptime higher than a typical internal tool, and should inform on-call/monitoring decisions once infrastructure planning starts.

## 7. Compliance / Data Handling (flagged, not resolved)

- Client contact info (data-model.md §4 `client` table) is personal data belonging to the agency's clients, processed by infyra.cloud as a sub-processor. Terms of service / DPA implications are a legal/business decision, not an engineering one, but the data model should support easy export and deletion of a client record to avoid retrofitting this later.
