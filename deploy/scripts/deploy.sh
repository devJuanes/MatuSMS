#!/usr/bin/env bash
# Despliegue completo MatuSMS — git pull + build + nginx + pm2
# Uso en el servidor:
#   cd ~/apps/MatuSMS && bash deploy/scripts/deploy.sh
set -euo pipefail

ROOT="${MATUSMS_ROOT:-/root/apps/MatuSMS}"
BRANCH="${MATUSMS_BRANCH:-main}"
export MATUSMS_ROOT="$ROOT"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

echo "=== MatuSMS deploy ==="
echo "ROOT=$ROOT  PORT=$MATUSMS_API_PORT  WEB=$MATUSMS_WEB_PUBLIC_DIR"
echo ""

cd "$ROOT"

if [[ -d .git ]]; then
  echo "==> git pull ($BRANCH)"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
fi

echo "==> pnpm install"
pnpm install --frozen-lockfile

echo "==> pnpm build:prod"
pnpm build:prod

matusms_fix_env
matusms_publish_web
matusms_start_pm2
matusms_install_nginx

echo ""
echo "✓ Despliegue completado"
echo "  Web:  https://matusms.matubyte.com"
echo "  API:  https://api.sms.matubyte.com/health"
echo "  Docs: https://api.sms.matubyte.com/docs"
