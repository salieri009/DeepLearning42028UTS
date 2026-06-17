#!/usr/bin/env bash
# Download and extract best.pt from a completed SageMaker training job (ADR-0003 handoff).
#
# Usage:
#   ./infra/scripts/fetch_best_pt.sh crowdnav-yolo-1234567890
#   ./infra/scripts/fetch_best_pt.sh my-job my-bucket application/models

set -euo pipefail

JOB_NAME="${1:?Usage: fetch_best_pt.sh JOB_NAME [BUCKET] [DEST_DIR]}"
BUCKET="${2:-crowdnav-jrdb-data}"
DEST="${3:-application/models}"
REGION="${AWS_REGION:-ap-southeast-2}"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

STAGING="runs/sagemaker/${JOB_NAME}"
mkdir -p "$STAGING"

TAR_KEY="output/${JOB_NAME}/output/model.tar.gz"
TAR_LOCAL="${STAGING}/model.tar.gz"

echo "[CrowdNav] Downloading s3://${BUCKET}/${TAR_KEY} ..."
aws s3 cp "s3://${BUCKET}/${TAR_KEY}" "$TAR_LOCAL" --region "$REGION"

echo "[CrowdNav] Extracting to ${STAGING} ..."
tar -xzf "$TAR_LOCAL" -C "$STAGING"

if [[ ! -f "${STAGING}/best.pt" ]]; then
  echo "ERROR: best.pt not found in archive. Contents:" >&2
  ls -la "$STAGING" >&2
  exit 1
fi

mkdir -p "$DEST"
cp -f "${STAGING}/best.pt" "${DEST}/best.pt"

echo "[CrowdNav] Installed: ${DEST}/best.pt"
echo "[CrowdNav] Next: cd application && docker compose up --build"
