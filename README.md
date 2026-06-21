# Sheep farm monorepo (Lanapp)

Single repo for API, UI, auth, and shared packages. No duplicated `@sheep/domain`.

| Package | Path | Port |
|---------|------|------|
| **UI** | [`lanapp-ui/`](lanapp-ui/) | 3000 |
| **API** | [`lanapp/`](lanapp/) | 4001 |
| **Auth** | [`auth/`](auth/) | 4000 |
| **Domain** | [`packages/domain/`](packages/domain/) | `@sheep/domain` |
| **Server helpers** | [`packages/server/`](packages/server/) | `@sheep/server` |

UI contract for v0: [`lanapp-ui/docs/APP_CONTEXT.md`](lanapp-ui/docs/APP_CONTEXT.md)

**User guide (operators, ES):** [`lanapp-ui/docs/GUIA_USUARIO.md`](lanapp-ui/docs/GUIA_USUARIO.md) — flows, roles, validations: [`ROLES.md`](lanapp-ui/docs/ROLES.md) · [`VALIDACIONES.md`](lanapp-ui/docs/VALIDACIONES.md)

**Manual testing (lifecycle, dates, destete, breeding):** [`docs/TESTING_SHEEP_LIFECYCLE.md`](docs/TESTING_SHEEP_LIFECYCLE.md)

## Local development

Always install from **this directory** (`webapp/`):

```bash
make setup
cp lanapp-ui/.env.example lanapp-ui/.env
cp lanapp/.env.example lanapp/.env

make db          # Postgres (once, or after reboot)
make migrate     # pending migrations (optional — API also runs them on start)
make seed        # optional demo fixtures

make api         # terminal 1 — API :4001
make ui          # terminal 2 — UI :3000
```

Open [http://localhost:3000](http://localhost:3000). With `SKIP_AUTH=true` / `NEXT_PUBLIC_SKIP_AUTH=true` no login is required locally.

Run `make help` for all commands (`db`, `migrate`, `migrate-revert`, `seed`, …).

## v0 workflow (monorepo)

1. **Import this GitHub repo** in [v0](https://v0.app) (not the old `lanapp-ui`-only repo).
2. Reconnect or create a v0 project pointing at **`webapp`** root.
3. Every v0 prompt:

```
Monorepo: webapp/
Edit ONLY lanapp-ui/ — never lanapp/, packages/, auth/.
@sheep/domain is packages/domain (npm workspace "*").
Read lanapp-ui/docs/APP_CONTEXT.md.
Use lib/api/* for wired pages. Spanish UI, indigo dashboard.
```

4. **Install / dev in v0 sandbox** (from repo root):

```bash
npm install
npm run build:packages
npm run dev -w lanapp-ui
```

5. **Vercel (UI deploy):** Root Directory = `lanapp-ui`, include monorepo install from repository root.

v0 preview cannot reach `localhost:4001` — test API integration in Cursor with `npm run dev:api` + `dev:ui`.

## One-time git consolidation

Today `lanapp-ui/`, `lanapp/`, and `auth/` may still have **nested `.git`** folders. To use one remote:

```bash
cd webapp

# 1. Remove nested repos (backup remotes first if you need history)
rm -rf lanapp-ui/.git lanapp/.git auth/.git

# 2. Init single repo
git init
git add .
git commit -m "Consolidate webapp monorepo (lanapp, lanapp-ui, auth, packages)"

# 3. Create github.com/you/webapp and push
git remote add origin git@github.com:YOUR_ORG/webapp.git
git branch -M main
git push -u origin main

# 4. Archive old lanapp-ui-only remote; point v0 + Vercel to webapp
```

## Archived code

Retired packages: [`../webapp-backup`](../webapp-backup) (`web-app`, `mock-server`, `sheep-ai`).
