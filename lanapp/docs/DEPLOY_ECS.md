# Lanapp API — ECS deployment

Deploy the lanapp backend to AWS ECS Fargate on the shared infrastructure in [`infra`](../../../infra/infra/).

## Architecture (already provisioned)

| Resource | Name / value |
|----------|----------------|
| ECS cluster | `mexp-apps-shared-cluster` |
| ECR repository | `mexp-lanapp-back` |
| ALB host | `lanapp-api.myxperiences.org` |
| Target group | `mexp-lanapp-back-tg` (port **3000**) |
| Health check | `GET /api/v1/lanapp/health` → 200 |
| RDS PostgreSQL | `lanappdb`, user `user_lanapp`, schema `lanapp` |
| S3 bucket | `mexp-imagenes-lanapp-unique-id` |
| Container SG | `mexp-ecs-containers-sg` (ingress 3000 from ALB only) |
| DB SG | `mexp-rds-database-sg` (ingress 5432 from container SG) |

Subnets: `mexp-public-subnet-1a`, `mexp-public-subnet-1b` (public, `assignPublicIp: ENABLED` for Fargate).

## Image build (linux/amd64)

The API lives in an npm workspace monorepo (`@sheep/domain`, `@sheep/server`, `lanapp`). **Build context must be the `webapp/` root**, not `lanapp/` alone.

### Option A — helper script (build + push to ECR)

```bash
cd webapp
chmod +x scripts/build-lanapp-image.sh
./scripts/build-lanapp-image.sh
# → pushes .../mexp-lanapp-back:a1b2c3d (7-char git commit)

# Or override the tag:
./scripts/build-lanapp-image.sh v1.0.0
```

### Option B — manual buildx

```bash
cd webapp

aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin 991795763909.dkr.ecr.us-east-1.amazonaws.com

docker buildx build \
  --platform linux/amd64 \
  -f lanapp/Dockerfile \
  -t 991795763909.dkr.ecr.us-east-1.amazonaws.com/mexp-lanapp-back:latest \
  --push \
  .
```

Local smoke test (no push):

```bash
docker buildx build --platform linux/amd64 -f lanapp/Dockerfile -t lanapp-api:local --load .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgres://... \
  -e DATABASE_SCHEMA=lanapp \
  -e SKIP_AUTH=true \
  lanapp-api:local
curl http://localhost:3000/api/v1/lanapp/health
```

## Environment variables

The container reads **environment variables at startup** (`process.env`). There is no `.env` file inside the image.

- **Local:** `lanapp/.env` (loaded by `dotenv` in dev)
- **ECS:** same keys, set on the **task definition** when you create the service

### Production (ECS task definition)

| Variable | Example | Notes |
|----------|---------|-------|
| `PORT` | `3000` | Must match the ALB target group |
| `NODE_ENV` | `production` | |
| `DATABASE_URL` | `postgres://user_lanapp:…@….rds.amazonaws.com:5432/lanappdb` | Postgres connection string |
| `DATABASE_SCHEMA` | `lanapp` | |
| `AWS_S3_BUCKET` | `mexp-imagenes-lanapp-unique-id` | Photo uploads |
| `AUTH0_DOMAIN` | `your-tenant.auth0.com` | JWT validation |
| `AUTH0_AUDIENCE` | `https://api.lanapp.sheep` | JWT validation |

Copy-paste template: [`.env.ecs.example`](../.env.ecs.example).

In the ECS console / task definition JSON, put non-sensitive values in `environment` and `DATABASE_URL` in `secrets` (e.g. Secrets Manager). S3 auth comes from the **task IAM role**, not env vars.

### Local development

| Variable | Example |
|----------|---------|
| `PORT` | `4001` |
| `NODE_ENV` | `development` |
| `DATABASE_URL` | `postgres://…@localhost:5434/webapp` |
| `DATABASE_SCHEMA` | `lanapp` |
| `SKIP_AUTH` | `true` |

Template: [`.env.example`](../.env.example). Use `SKIP_AUTH` locally instead of Auth0.

Migrations run automatically on startup (`migrationsRun: true` in TypeORM config).

## IAM task role

Attach a task role with at least:

- `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::mexp-imagenes-lanapp-unique-id/*`
- Optional: `secretsmanager:GetSecretValue` if using Secrets Manager for `DATABASE_URL`

Execution role: standard `AmazonECSTaskExecutionRolePolicy` (pull from ECR, write logs).

## ECS task definition (Fargate)

Example: [`infra/ecs/lanapp-back-task-definition.example.json`](../../../infra/ecs/lanapp-back-task-definition.example.json).

Key settings:

- **Launch type**: FARGATE
- **CPU / memory**: `512` / `1024` (adjust as needed)
- **Network**: `awsvpc`, public subnets, `assignPublicIp: ENABLED`
- **Security groups**: `mexp-ecs-containers-sg`
- **Container port**: `3000`
- **Log driver**: `awslogs` → `/ecs/mexp-lanapp-back`

Register and create service:

```bash
aws ecs register-task-definition --cli-input-json file://infra/ecs/lanapp-back-task-definition.example.json

aws ecs create-service \
  --cluster mexp-apps-shared-cluster \
  --service-name mexp-lanapp-back \
  --task-definition mexp-lanapp-back \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-zzz],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:991795763909:targetgroup/mexp-lanapp-back-tg/...,containerName=lanapp-api,containerPort=3000"
```

Replace subnet/SG ARNs from the AWS console or `terraform state show`.

## ALB health check

Terraform sets the lanapp backend target group health path to `/api/v1/lanapp/health`. After changing Terraform:

```bash
cd infra/infra
terraform apply
```

Verify:

```bash
curl -s https://lanapp-api.myxperiences.org/api/v1/lanapp/health
```

## Rollout checklist

1. Apply Terraform (ECR, cluster, target group health path, RDS, ALB rule).
2. Store `DATABASE_URL` and Auth0 values in Secrets Manager.
3. Build and push amd64 image (`./scripts/build-lanapp-image.sh` tags with the current commit short SHA).
4. Register task definition with new image tag.
5. Create or update ECS service → target group `mexp-lanapp-back-tg`.
6. Confirm targets healthy in EC2 → Target Groups.
7. Hit `https://lanapp-api.myxperiences.org/api/v1/lanapp/health`.
8. Point `lanapp-ui` `NEXT_PUBLIC_API_URL` (or equivalent) at the same host.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Task stops immediately | Wrong `DATABASE_URL`, RDS SG, or failed migrations |
| Target unhealthy | `PORT` ≠ 3000, app not listening, or health path mismatch |
| 401 on API routes | Missing Auth0 env vars or `SKIP_AUTH` not set locally only |
| S3 upload errors | Task role missing S3 permissions on lanapp bucket |
| `Cannot find module '@sheep/domain'` | Image built from `lanapp/` only — rebuild from `webapp/` root |

## Related

- Infra summary: [`infra/docs/LANAPP_API_DEPLOY.md`](../../../infra/docs/LANAPP_API_DEPLOY.md)
- Local env template: [`lanapp/.env.example`](../.env.example)
