# Module: Identity & Workspace — Engineering Notes

Drill-down on product.md §3. Backed by `packages/auth` (Better Auth) + `packages/db`.

---

## Build Notes

- **Better Auth covers most of §3's auth surface directly** — email/password, GitHub OAuth, Google OAuth, and session management are Better Auth's core feature set, not custom-built. See the `better-auth-best-practices` skill for setup specifics when implementation starts. This significantly de-scopes what needs custom engineering here versus what product.md's bullet list might suggest.
- **Workspace-scoped session** (product.md: "a logged-in user's active workspace determines what they see") is the one piece Better Auth doesn't give for free — it handles *user* sessions, not *active workspace* selection. Needs a session-attached or request-header-attached "current workspace" concept, validated against `workspace_member` on every request.
- **Multi-workspace membership** means the workspace switcher UI and the "current workspace" resolution must be explicit and unambiguous — no implicit "last used" fallback that could leak into a request without validation.

## Edge Cases to Design For

1. **Invite to a workspace for a not-yet-registered email.** Does the invite create a pending record that activates on signup, or require signup first? product.md doesn't specify — needs a decision (pending-invite table + activation-on-signup is the common pattern).
2. **Last Owner leaving/being removed.** A workspace with zero Owners is a stuck state (nobody can manage billing or delete the workspace). Should be blocked at the API layer — reject removing/demoting the last Owner.
3. **Role change mid-session.** If a user's role changes while they have an active session, does the change apply immediately or on next login? Affects whether permission checks hit the DB per-request or trust a cached session claim — informs a real implementation choice, not just a UX nicety.
4. **GitHub/Google OAuth email collision.** A user signs up with email/password, then later tries "Login with Google" using the same email — merge accounts or block? Standard Better Auth account-linking question, needs a product decision.

## Out of Scope (confirmed by product.md)

- SSO/SAML — explicitly deferred (product.md §3). Don't build extensibility hooks for it speculatively; adding it later is a distinct, self-contained project against Better Auth's plugin system, not something this module's schema needs to pre-accommodate.

## Dependencies

- Blocks everything else — every other module's permission checks depend on workspace + role resolution existing first. This is the first module to build.
