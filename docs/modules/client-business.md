# Module: Client & Business Layer — Engineering Notes

Drill-down on product.md §7. Per product.md, this is the module that "distinguishes infyra.cloud from a generic connect-your-accounts dashboard" — worth treating as a first-class engineering priority, not a v2 add-on, despite billing/invoicing traditionally being the kind of feature teams defer.

---

## Build Notes

- **White-label branding** requires host-based resolution in `apps/platform` — incoming request's hostname (custom subdomain or CNAME'd custom domain) determines which workspace's branding to render, before any auth even happens (a client hitting `acmeagency.infyra.cloud` or `panel.acmeagency.com` needs to see Acme's logo on the *login screen*, not after logging in). This is a routing-layer concern, not just a "load branding_config after auth" concern.
- **Custom domain via CNAME** needs the same domain-verification machinery as project domains (project-resource-management.md), but for the workspace's own branding domain — worth checking if this can share code with project domain verification rather than being built twice.
- **Markup application** — product.md says "the agency's own markup applied on top of underlying provider costs." The data model (data-model.md §4) supports percent or flat markup per client. Needs a decision on whether markup can also be set at the workspace-default level with per-client overrides, or is strictly per-client from day one — affects `recurring_billing_schedule` schema now vs. later.
- **Stripe integration** handles payment collection — standard webhook-driven flow (`invoice.paid`, `invoice.payment_failed`), needs signature verification (nfr.md §1) and idempotent event handling (Stripe explicitly documents webhooks can be delivered more than once).
- **Client portal** is read-only and explicitly excludes "other clients, credentials, or the agency's other infrastructure" (product.md §7). Implemented as a structurally separate route namespace per api-surface.md §6 — this is a security-relevant isolation choice, not just an implementation convenience.

## Edge Cases to Design For

1. **Invoice generation when underlying provider usage data is incomplete or delayed.** Some providers may not expose finalized usage until after a billing period closes. Needs a defined "invoice draft vs. finalized" state so an agency doesn't send a client an invoice based on partial data.
2. **Client deleted while they have open invoices or active portal access.** Should probably be blocked or require explicit handling (archive rather than delete) rather than silently cascading.
3. **Markup changed mid-billing-period.** Does the change apply retroactively to the current period or only going forward? Needs explicit product decision — retroactive billing changes are the kind of thing that generates support tickets and trust problems if unclear.
4. **Custom domain SSL/cert provisioning.** Not mentioned in product.md but implied by "custom domain via CNAME" — needs to be resolved (likely: whatever the deploy provider's own domain API + cert automation handles, reusing existing adapter capability rather than infyra.cloud running its own cert issuance).
5. **Currency handling for multi-region agencies.** product.md doesn't mention multi-currency; flagged as a scoping question rather than assumed — likely single-currency-per-workspace at launch (matches product.md's "small to mid-sized" target and avoids FX complexity) but worth confirming before the `invoice` table's currency field is treated as fixed.

## Dependencies

- Client records depend on Identity & Workspace (workspace scoping) but not on Provider Connections directly — a client record can exist before any project is provisioned.
- Billing depends on Observability's usage data (can't compute markup on a cost you haven't measured) — so billing accuracy is downstream of observability being correct, not independent of it.
