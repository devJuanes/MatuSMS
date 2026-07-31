#!/usr/bin/env bash
# Despliegue sin git pull (misma lógica que deploy.sh)
set -euo pipefail

export MATUSMS_ROOT="${MATUSMS_ROOT:-/root/apps/MatuSMS}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

echo "=== MatuSMS safe-setup ==="
echo "ROOT=$MATUSMS_ROOT  PORT=$MATUSMS_API_PORT"
echo ""

cd "$MATUSMS_ROOT"

if command -v ss &>/dev/null && ss -tlnp | grep -q ":$MATUSMS_API_PORT "; then
  if ! pm2 describe matusms-api &>/dev/null; then
    echo "✗ Puerto $MATUSMS_API_PORT ocupado. Prueba: MATUSMS_API_PORT=8010 bash deploy/scripts/safe-setup.sh"
    exit 1
  fi
fi

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  pnpm install --frozen-lockfile
  pnpm build:prod
fi

matusms_fix_env
matusms_publish_web
matusms_start_pm2

if [[ "${SKIP_NGINX:-0}" != "1" ]]; then
  matusms_install_nginx
fi

echo ""
echo "✓ MatuSMS listo"
