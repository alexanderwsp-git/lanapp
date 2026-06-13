# lanapp-ui

**Lanapp frontend** — Next.js for Granja San Alfonso. Part of the [`webapp`](../) monorepo.

📄 **[Application context → `docs/APP_CONTEXT.md`](docs/APP_CONTEXT.md)**

## Development

**Always work from monorepo root** (`webapp/`):

```bash
cd ..   # webapp/
npm install && npm run build:packages
npm run dev:api    # :4001 — separate terminal
npm run dev:ui     # :3000
```

`@sheep/domain` resolves via npm workspaces — **no vendored copy** in this folder.

Copy `.env.example` → `.env` for local settings. API proxy: `next.config.mjs` → `LANAPP_SERVICE_URL`.

## v0

Import the **`webapp`** repo in v0 (not this folder alone). Edit only `lanapp-ui/` paths. See [`../README.md`](../README.md) § v0 workflow.

[Legacy v0 project](https://v0.app/chat/projects/prj_xGMDAzDXq3zG8TcIWiDx2HWiTC3x) — reconnect to monorepo when ready.

## API client

Wired pages use [`lib/api/`](lib/api/). Status: [`docs/APP_CONTEXT.md`](docs/APP_CONTEXT.md) §2.7.
