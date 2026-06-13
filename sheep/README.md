# Sheep AI Farm Management Platform

Product documentation and specs for the sheep farm app. **All code lives in the parent [`webapp/`](../) monorepo.**

## Decision: evolve the monorepo (do not start from scratch)

| Package | Role |
|---------|------|
| [`lanapp-ui`](../lanapp-ui) | **Frontend** — Next.js + v0 (:3000) |
| [`lanapp`](../lanapp) | **API** — domain REST (:4001) |
| [`packages/domain`](../packages/domain) | **Done** — `@sheep/domain` Spanish enums + Zod |
| [`packages/server`](../packages/server) | **Done** — `@sheep/server` Express middleware |
| [`auth`](../auth) | **Refactor** — Auth0 |

Archived (see [`../../webapp-backup`](../../webapp-backup)): `web-app`, `mock-server`, `sheep-ai`.
| [`infra/webapp/tf`](../../infra/webapp/tf) | **Reuse** + S3 |

See [`docs/ARCHITECTURE_PLAN.md`](docs/ARCHITECTURE_PLAN.md) Section 2 for the full reuse matrix and timeline (**13–15 weeks** vs **23–25 weeks** greenfield).

## Local dev (when building)

```bash
# From webapp/ root — install workspaces once, then run services
npm install
npm run build:packages

npm run dev:api                 # :4001  (from webapp/ root)
npm run dev:ui                  # :3000
# auth :4000 — cd auth && npm run dev when needed
```
