#!/usr/bin/env bash
# Despliegue / actualización de MatuSMS en producción
set -euo pipefail

ROOT="${MATUSMS_ROOT:-/var/www/matusms}"
BRANCH="${MATUSMS_BRANCH:-main}"

echo "==> MatuSMS deploy — $ROOT (rama: $BRANCH)"

cd "$ROOT"

if [[ -d .git ]]; then
  echo "==> git pull"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  echo "ERROR: $ROOT no es un repositorio git. Clona primero:"
  echo "  git clone <tu-repo> $ROOT"
  exit 1
fi

echo "==> pnpm install"
pnpm install --frozen-lockfile

echo "==> build (shared + api + web)"
pnpm build:prod

echo "==> PM2 — API"
export MATUSMS_ROOT="$ROOT"
mkdir -p "$ROOT/logs"

if pm2 describe matusms-api &>/dev/null; then
  pm2 reload "$ROOT/deploy/ecosystem.config.cjs" --update-env
else
  pm2 start "$ROOT/deploy/ecosystem.config.cjs"
  pm2 save
fi

echo "==> Nginx — validar y recargar"
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "✓ Despliegue completado."
echo "  API:  https://api.sms.matubyte.com/health"
echo "  Web:  https://matusms.matubyte.com"
echo "  Docs: https://api.sms.matubyte.com/docs"
