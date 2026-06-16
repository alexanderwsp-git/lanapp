# Lanapp UI (Next.js) for ECS Fargate.
#
# Build from the webapp monorepo root:
#   docker buildx build --platform linux/amd64 -f lanapp-ui/Dockerfile -t mexp-lanapp-front .
#
# Or use: ./scripts/build-lanapp-ui-image.sh [tag]

# syntax=docker/dockerfile:1

ARG NODE_VERSION=20-bookworm-slim
ARG LANAPP_SERVICE_URL=https://lanapp-api.myxperiences.org

FROM node:${NODE_VERSION} AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/domain/package.json packages/domain/
COPY lanapp-ui/package.json lanapp-ui/
COPY lanapp/package.json lanapp/
COPY auth/package.json auth/
COPY packages/server/package.json packages/server/

RUN npm ci --workspace=lanapp-ui --include-workspace-root

FROM node:${NODE_VERSION} AS builder
WORKDIR /app

ARG LANAPP_SERVICE_URL
ENV LANAPP_SERVICE_URL=$LANAPP_SERVICE_URL
ENV NEXT_PUBLIC_API_PREFIX=/api/v1

COPY --from=deps /app ./
COPY packages/domain packages/domain
COPY lanapp-ui lanapp-ui

RUN npm install --workspace=lanapp-ui --include-workspace-root --prefer-offline \
 && npm run build -w @sheep/domain \
 && npm run build -w lanapp-ui -- --webpack

FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/lanapp-ui/.next/standalone ./
COPY --from=builder /app/lanapp-ui/.next/static ./lanapp-ui/.next/static
COPY --from=builder /app/lanapp-ui/public ./lanapp-ui/public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/',r=>process.exit(r.statusCode>=200&&r.statusCode<400?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "lanapp-ui/server.js"]
