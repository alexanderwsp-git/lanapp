# Lanapp API image (linux/amd64 for ECS Fargate).
#
# Build from the webapp monorepo root:
#   docker buildx build --platform linux/amd64 -f lanapp/Dockerfile -t mexp-lanapp-back .
#
# Or use: ./scripts/build-lanapp-image.sh [tag]

# syntax=docker/dockerfile:1

ARG NODE_VERSION=20-bookworm-slim

FROM --platform=linux/amd64 node:${NODE_VERSION} AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/domain/package.json packages/domain/
COPY packages/server/package.json packages/server/
COPY lanapp/package.json lanapp/
COPY auth/package.json auth/
COPY lanapp-ui/package.json lanapp-ui/

RUN npm ci --workspace=lanapp --include-workspace-root

FROM --platform=linux/amd64 node:${NODE_VERSION} AS builder
WORKDIR /app

COPY --from=deps /app ./
COPY packages/domain packages/domain
COPY packages/server packages/server
COPY lanapp lanapp

RUN npm run build -w @sheep/domain \
 && npm run build -w @sheep/server \
 && cd lanapp \
 && npx --yes esbuild@0.25.0 "src/**/*.ts" \
      --outdir=dist --outbase=src --platform=node --format=cjs --packages=external

FROM --platform=linux/amd64 node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
COPY packages/domain/package.json packages/domain/
COPY packages/server/package.json packages/server/
COPY lanapp/package.json lanapp/
COPY auth/package.json auth/
COPY lanapp-ui/package.json lanapp-ui/

RUN npm ci --workspace=lanapp --include-workspace-root --omit=dev

COPY --from=builder /app/packages/domain/dist packages/domain/dist
COPY --from=builder /app/packages/server/dist packages/server/dist
COPY --from=builder /app/lanapp/dist lanapp/dist

WORKDIR /app/lanapp

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/lanapp/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/index.js"]
