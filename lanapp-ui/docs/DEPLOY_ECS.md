# Lanapp UI — ECS deployment

## Infrastructure (Terraform)

| Resource | Value |
|----------|--------|
| ECR | `mexp-lanapp-front` |
| ECS cluster | `mexp-apps-shared-cluster` |
| ALB host | `lanapp.myxperiences.org` |
| Target group | `mexp-lanapp-front-tg` (port **3000**) |
| CloudWatch logs | `/ecs/mexp-lanapp-front` (Terraform) |
| Health check | `GET /` → 200 |

API is at `lanapp-api.myxperiences.org`. The UI proxies `/api/v1/lanapp/*` to that host via Next.js rewrites.

## 1. Build & push image

Build context is the **`webapp/`** monorepo root.

```bash
cd webapp
chmod +x scripts/build-lanapp-ui-image.sh
./scripts/build-lanapp-ui-image.sh
```

`LANAPP_SERVICE_URL` is **baked in at build time** (default `https://lanapp-api.myxperiences.org`). Override if needed:

```bash
LANAPP_SERVICE_URL=https://lanapp-api.myxperiences.org ./scripts/build-lanapp-ui-image.sh
```

## 2. Task definition

Edit `webapp-infra/ecs/lanapp-front-task-definition.json` — set the image tag to match the build.

Runtime env vars (only these):

| Variable | Value |
|----------|--------|
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `HOSTNAME` | `0.0.0.0` |

## 3. Deploy

**First time:**

```bash
cd webapp-infra/ecs
chmod +x create-frontend.sh update-frontend.sh
./create-frontend.sh
```

**Updates (new image tag):**

```bash
cd webapp-infra/ecs
./update-frontend.sh
```

## 4. Verify

```bash
curl -sI https://lanapp.myxperiences.org/
curl -s https://lanapp-api.myxperiences.org/api/v1/lanapp/health
```

Open the UI in a browser and confirm API calls work (Network tab → `/api/v1/lanapp/...`).

## Auth (current: disabled)

Production uses **`SKIP_AUTH=true` on the lanapp API** task (`lanapp-back-task-definition.json`). No JWT or auth service required.

The UI login page is a stub (does not call `/api/v1/g/*`). `NEXT_PUBLIC_SKIP_AUTH` in `.env` is **not read by the app** — only the API flag matters.

When you deploy the `auth` service later:

1. Deploy `auth/` to ECS and set `AUTH_SERVICE_URL` at UI image build
2. Wire `app/login/page.tsx` to `POST /api/v1/g/auth/login`
3. Remove `SKIP_AUTH` from the API task and add `AUTH0_*` env vars

## Notes

- Rebuild the image if the API URL changes (`LANAPP_SERVICE_URL` build-arg).
- CloudWatch log group `/ecs/mexp-lanapp-front` is provisioned by Terraform (`aws_cloudwatch_log_group.lanapp_front_logs`).
