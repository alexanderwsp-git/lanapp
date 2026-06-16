#!/usr/bin/env bash
# Build and push the lanapp UI image to ECR (linux/amd64).
#
# Usage:
#   ./scripts/build-lanapp-ui-image.sh [tag]
#
# Default tag: first 7 characters of the current git commit.
# API rewrite target is baked in at build time (LANAPP_SERVICE_URL).

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-991795763909}"
ECR_REPO="${ECR_REPO:-mexp-lanapp-front}"
LANAPP_SERVICE_URL="${LANAPP_SERVICE_URL:-https://lanapp-api.myxperiences.org}"
AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-https://lanapp-api.myxperiences.org}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT}"

if [ -n "${1:-}" ]; then
  IMAGE_TAG="$1"
else
  IMAGE_TAG="$(git rev-parse --short=7 HEAD)"
fi

IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}"

echo "Image tag: ${IMAGE_TAG} (git: $(git rev-parse HEAD))"
echo "LANAPP_SERVICE_URL: ${LANAPP_SERVICE_URL}"

aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

docker buildx build \
  --platform linux/amd64 \
  -f lanapp-ui/Dockerfile \
  --build-arg "LANAPP_SERVICE_URL=${LANAPP_SERVICE_URL}" \
  --build-arg "AUTH_SERVICE_URL=${AUTH_SERVICE_URL}" \
  -t "${IMAGE_URI}" \
  --push \
  .

echo "Done: ${IMAGE_URI}"
