# Lanapp UI — ECS deployment

## Infrastructure (Terraform)

| Resource | Value |
|----------|--------|
| ECR | `mexp-lanapp-front` |
| ECS cluster | `mexp-apps-shared-cluster` |
| ALB host | `lanapp.myxperiences.org` |
| Target group | `mexp-lanapp-front-tg` (port **3000**) |
| CloudWatch logs | `/ecs/mexp-lanapp-front` (Terraform) |
| Health check | `GET /api/health` → 200 |

API is at `lanapp-api.myxperiences.org`. The UI proxies `/api/v1/lanapp/*` to that host via Next.js rewrites.

## Deploy (recommended)

From [`webapp-infra/ecs-lanapp/`](../../webapp-infra/ecs-lanapp/):

```bash
cd webapp-infra/ecs-lanapp
cp .env_backend.example .env_backend    # first time only
cp .env_frontend.example .env_frontend  # first time only
# edit .env_* with Cognito, DATABASE_URL, etc.

make deploy          # backend + frontend
make deploy-front    # UI only
make deploy-back     # API only
```

The Makefile:

1. Builds and pushes Docker images to ECR (tag = first 7 chars of `git rev-parse HEAD` in `webapp/`)
2. Updates `IMAGE_TAG` in `.env_backend` / `.env_frontend`
3. Runs `update-backend.sh` / `update-frontend.sh` (register task definition + ECS rollout)

ECS-only (image already pushed):

```bash
make update-front
make update-back
```

See [`ecs-lanapp/README.md`](../../webapp-infra/ecs-lanapp/README.md) for all targets.

## Manual build (alternative)

Build context is the **`webapp/`** monorepo root.

```bash
cd webapp
./scripts/build-lanapp-ui-image.sh
./scripts/build-lanapp-image.sh
```

`LANAPP_SERVICE_URL`, `NEXT_PUBLIC_API_PREFIX` and `NEXT_PUBLIC_SKIP_AUTH` are **baked in at build time** (Dockerfile build-args). `make build-front` loads them from `.env_frontend`. Override manually:

```bash
cd webapp-infra/ecs-lanapp
set -a && source .env_frontend && set +a
cd ../../webapp && ./scripts/build-lanapp-ui-image.sh
```

Then sync the tag and update ECS:

```bash
cd webapp-infra/ecs-lanapp
make update-front   # or update-back / update-all
```

## Task definition

Templates: [`webapp-infra/ecs-lanapp/lanapp-front-task-definition.json`](../../webapp-infra/ecs-lanapp/lanapp-front-task-definition.json) and `lanapp-back-task-definition.json`.

Runtime env vars come from `.env_frontend` / `.env_backend` (see `.env_*.example`).

**Frontend** (`.env_frontend`):

| Variable | Build / runtime | Value (prod) |
|----------|-----------------|--------------|
| `PORT` | runtime | `3000` |
| `NODE_ENV` | runtime | `production` |
| `HOSTNAME` | runtime | `0.0.0.0` |
| `NEXT_PUBLIC_API_PREFIX` | build + runtime | `/api/v1` |
| `LANAPP_SERVICE_URL` | build (rewrites) + runtime | `https://lanapp-api.myxperiences.org` |
| `AUTH_SERVICE_URL` | runtime | optional (unused by UI today) |
| `NEXT_PUBLIC_SKIP_AUTH` | build + runtime | `false` |
| `AWS_REGION` | runtime | e.g. `us-east-1` |
| `COGNITO_USER_POOL_ID` | runtime | Terraform output |
| `COGNITO_CLIENT_ID` | runtime | Terraform output |
| `COGNITO_CLIENT_SECRET` | runtime | Terraform output |
| `IMAGE_TAG` | deploy script | Set by `make` from git |

**No** `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — login uses `InitiateAuth` with only `COGNITO_*`. Inviting users uses the **task role** `mexp-lanapp-front-task-role`.

See [`docs/AUTH.md`](AUTH.md) for the full auth flow.

## First-time ECS services

```bash
cd webapp-infra/ecs-lanapp
make create-back
make create-front
```

## Rollout (ECS)

Configured in [`deploy-flags.sh`](../../webapp-infra/ecs-lanapp/deploy-flags.sh) and applied by create/update scripts:

| Setting | Value |
|---------|--------|
| `desired-count` | 2 |
| `minimumHealthyPercent` | 100 |
| `maximumPercent` | 200 |
| Circuit breaker + rollback | enabled |
| `healthCheckGracePeriodSeconds` | 120 |

Rolling deploy: ECS starts new tasks before draining old ones. If the new revision fails health checks, **circuit breaker rolls back** to the previous task definition. The UI liveness probe is `GET /api/health` (200 only).

After changing the ALB target group health path, run **`terraform apply`** in `webapp-infra/iac/src/v1/` before deploying a UI image that exposes `/api/health`.

## Verify

```bash
curl -s https://lanapp.myxperiences.org/api/health
curl -s https://lanapp-api.myxperiences.org/api/v1/lanapp/health
```

Open the UI in a browser and confirm API calls work (Network tab → `/api/v1/lanapp/...`).

## Auth

- UI auth: Cognito via Next.js API routes (`/api/auth/*`). See [`docs/AUTH.md`](AUTH.md).
- Login/forgot/reset: only `COGNITO_*` env vars in the container.
- Invite users (`/users`): ECS task role `mexp-lanapp-front-task-role` (no access keys in env).
- API JWT validation: set `SKIP_AUTH=false` on the lanapp API task and configure matching `COGNITO_*` vars.

## Notes

- Rebuild the image if the API URL changes (`LANAPP_SERVICE_URL` build-arg).
- CloudWatch log group `/ecs/mexp-lanapp-front` is provisioned by Terraform (`aws_cloudwatch_log_group.lanapp_front_logs`).

## Reset de datos (prod, post prueba F&F)

Puedes vaciar Postgres y empezar de cero **sin destruir RDS**. Los usuarios Cognito y archivos S3 son independientes.

### Antes de la prueba

1. Crear **snapshot RDS** en AWS Console (RDS → instancia `mexp-postgres-lanapp` → Take snapshot).

### Vaciar datos de la app

1. Conectar a `lanappdb` (Session Manager, bastion, o cliente con acceso al SG de RDS).
2. Ejecutar:

```bash
psql "postgres://user_lanapp:PASSWORD@HOST:5432/lanappdb" \
  -f webapp/lanapp/scripts/reset-lanapp-schema.sql
```

O manualmente:

```sql
DROP SCHEMA lanapp CASCADE;
CREATE SCHEMA lanapp;
GRANT ALL ON SCHEMA lanapp TO user_lanapp;
```

3. Reiniciar el servicio API ECS (`make update-back` o force new deployment) para que TypeORM ejecute migraciones (`migrationsRun: true`) y recree tablas vacías.
4. **No** ejecutar `npm run seed:demo` en prod salvo que quieras datos de demostración.

### Qué no se resetea con SQL

| Recurso | Acción manual |
|---------|----------------|
| Usuarios Cognito | Consola AWS o CLI `admin-delete-user` |
| Imágenes S3 | Vaciar bucket `mexp-imagenes-lanapp-*` si aplica |
| Parámetros reproducción | Se recrean con defaults al primer `GET /farm-parameters` |

Eliminar usuario de prueba en Cognito:

```bash
aws cognito-idp admin-delete-user \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "email@example.com"
```
