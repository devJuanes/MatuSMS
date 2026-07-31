#!/usr/bin/env bash
# Comprobaciones SIN modificar nada — solo MatuSMS
set -euo pipefail

ROOT="${MATUSMS_ROOT:-/root/apps/MatuSMS}"
PORT="${MATUSMS_API_PORT:-8000}"

echo "=== MatuSMS preflight (solo lectura) ==="
echo "ROOT: $ROOT"
echo "API port objetivo: $PORT"
echo ""

if [[ ! -d "$ROOT" ]]; then
  echo "✗ No existe $ROOT"
  exit 1
fi
echo "✓ Repo encontrado: $ROOT"

echo ""
echo "--- PM2 (otros procesos NO se tocarán) ---"
if command -v pm2 &>/dev/null; then
  pm2 list || true
  if pm2 describe matusms-api &>/dev/null; then
    echo "• matusms-api ya existe (se hará reload, no delete de otros)"
  else
    echo "• matusms-api no existe aún (se creará nuevo proceso)"
  fi
else
  echo "• PM2 no instalado"
fi

echo ""
echo "--- Puerto $PORT ---"
if command -v ss &>/dev/null; then
  if ss -tlnp | grep -q ":$PORT "; then
    echo "⚠ Puerto $PORT en uso:"
    ss -tlnp | grep ":$PORT " || true
    echo "  Sugerencia: MATUSMS_API_PORT=8010 bash deploy/scripts/deploy.sh"
  else
    echo "✓ Puerto $PORT libre"
  fi
fi

echo ""
echo "--- Nginx (solo listamos sitios existentes) ---"
if command -v nginx &>/dev/null; then
  ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true
  for site in api.sms.matubyte.com matusms.matubyte.com; do
    if [[ -f "/etc/nginx/sites-enabled/$site" ]]; then
      echo "• $site ya configurado"
    else
      echo "• $site pendiente de crear"
    fi
  done
else
  echo "• Nginx no instalado"
fi

echo ""
echo "--- Archivos MatuSMS ---"
for f in apps/api/.env apps/web/.env apps/api/service-account.json apps/api/dist/index.js apps/web/dist/index.html; do
  if [[ -f "$ROOT/$f" ]]; then
    echo "✓ $f"
  else
    echo "✗ falta $f"
  fi
done

if [[ -f /var/www/matusms-web/index.html ]]; then
  echo "✓ /var/www/matusms-web/index.html (nginx)"
else
  echo "✗ falta /var/www/matusms-web — ejecuta: bash deploy/scripts/deploy.sh"
fi

echo ""
echo "=== Fin preflight ==="
