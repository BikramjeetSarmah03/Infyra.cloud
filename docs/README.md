# infyra.cloud — Engineering Docs

Start with [product.md](./product.md) — the source of truth for what the product is and does. Everything else here is an engineering expansion of it: no new product scope has been introduced, only the technical decisions needed to build what product.md already specifies.

## Reading order

1. [product.md](./product.md) — product overview, modules, adapter design principle, permissions model
2. [architecture.md](./architecture.md) — how the modules map onto the actual monorepo (`apps/server`, `apps/platform`, `apps/www`, `packages/*`), request flows, open architectural questions
3. [adapter-design.md](./adapter-design.md) — deep dive on the `ProviderAdapter` interface, credential handling, and the new-provider checklist
4. [data-model.md](./data-model.md) — entity/schema breakdown for `packages/db`
5. [api-surface.md](./api-surface.md) — route inventory for `apps/server`
6. [permissions-matrix.md](./permissions-matrix.md) — action-level role matrix (expands product.md §10)
7. [nfr.md](./nfr.md) — non-functional requirements: security, reliability, data integrity, scale
8. [tasks.md](./tasks.md) — phased build roadmap, organized by module

## Module deep-dives

Each mirrors a module from product.md §2, with build notes, edge cases, and dependencies:

- [modules/identity-workspace.md](./modules/identity-workspace.md)
- [modules/provider-connections.md](./modules/provider-connections.md)
- [modules/project-resource-management.md](./modules/project-resource-management.md)
- [modules/client-business.md](./modules/client-business.md)
- [modules/observability.md](./modules/observability.md)

## Status

All docs above are planning-stage — no implementation has started against them yet (repo currently has scaffolding only: auth/db/env/ui packages exist but are unpopulated). Treat open questions flagged in architecture.md §6 and each module doc's "Edge Cases" section as decisions to resolve during build, not gaps in this documentation pass.
