#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Starting MatuSMS API..."
pnpm --filter @matusms/api dev
