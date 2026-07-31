#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Starting MatuSMS Dashboard..."
pnpm --filter @matusms/web dev
