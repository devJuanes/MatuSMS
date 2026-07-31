#!/usr/bin/env bash
# Despliegue AISLADO de MatuSMS — NO toca otras apps ni otros sitios Nginx
set -euo pipefail

ROOT="${MATUSMS_ROOT:-/root/apps/MatuSMS}"
PORT="${MATUSMS_API_PORT:-8000}"
BOOTSTRAP="${NGINX_BOOTSTRAP:-0}"
SKIP_NGINX="${SKIP_NGINX:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"

echo "=== MatuSMS safe-setup ==="
echo "ROOT=$ROOT PORT=$PORT"
echo "Solo se modifica: $ROOT, PM2[matusms-api], nginx[api.sms|matusms.matubyte.com]"
echo ""

cd "$ROOT"

# --- Preflight mínimo ---
[[ -f apps/api/.env ]] || { echo "✗ Falta apps/api/.env"; exit 1; }
[[ -f apps/web/.env ]]  || { echo "✗ Falta apps/web/.env"; exit 1; }

if command -v ss &>/dev/null && ss -tlnp | grep -q ":$PORT "; then
  if ! pm2 describe matusms-api &>/dev/null; then
    echo "✗ Puerto $PORT ocupado por otro servicio. Usa otro puerto:"
    echo "  MATuSMS_API_PORT=8010 bash deploy/scripts/safe-setup.sh"
    exit 1
  fi
fi

# Asegurar PORT en .env de la API (sin tocar otras líneas)
if grep -q '^PORT=' apps/api/.env; then
  sed -i "s/^PORT=.*/PORT=$PORT/" apps/api/.env
else
  echo "PORT=$PORT" >> apps/api/.env
fi

# Producción en API .env (solo estas claves)
for kv in \
  "NODE_ENV=production" \
  "CORS_ORIGIN=https://matusms.matubyte.com" \
  "API_PUBLIC_URL=https://api.sms.matubyte.com"; do
  key="${kv%%=*}"
  if grep -q "^${key}=" apps/api/.env; then
    sed -i "s|^${key}=.*|${kv}|" apps/api/.env
  else
    echo "$kv" >> apps/api/.env
  fi
done

# Web .env — VITE_API_BASE_URL
if grep -q '^VITE_API_BASE_URL=' apps/web/.env; then
  sed -i 's|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=https://api.sms.matubyte.com|' apps/web/.env
else
  echo 'VITE_API_BASE_URL=https://api.sms.matubyte.com' >> apps/web/.env
fi

if [[ "$SKIP_BUILD" != "1" ]]; then
  echo "==> pnpm install"
  pnpm install --frozen-lockfile
  echo "==> pnpm build:prod"
  pnpm build:prod
fi

echo "==> PM2 matusms-api (solo este proceso)"
export MATUSMS_ROOT="$ROOT"
mkdir -p "$ROOT/logs"

# Escribir ecosystem temporal con el puerto elegido
TMP_ECOSYSTEM="$(mktemp)"
sed "s/PORT: 8000/PORT: $PORT/" "$ROOT/deploy/ecosystem.config.cjs" > "$TMP_ECOSYSTEM"

if pm2 describe matusms-api &>/dev/null; then
  pm2 delete matusms-api 2>/dev/null || true
fi
pm2 start "$TMP_ECOSYSTEM"
rm -f "$TMP_ECOSYSTEM"
pm2 save

echo "==> Health local"
sleep 2
curl -sf "http://127.0.0.1:$PORT/health" && echo "" || echo "⚠ API aún no responde en :$PORT — revisa: pm2 logs matusms-api"

if [[ "$SKIP_NGINX" == "1" ]]; then
  echo "SKIP_NGINX=1 — no se tocó Nginx"
  exit 0
fi

echo "==> Nginx (solo sitios MatuSMS)"
API_CONF="/etc/nginx/sites-available/api.sms.matubyte.com"
WEB_CONF="/etc/nginx/sites-available/matusms.matubyte.com"

if [[ "$BOOTSTRAP" == "1" ]]; then
  cp "$ROOT/deploy/nginx/bootstrap/api.sms.matubyte.com.http.conf" /tmp/api.sms.matubyte.com.conf
  cp "$ROOT/deploy/nginx/bootstrap/matusms.matubyte.com.http.conf" /tmp/matusms.matubyte.com.conf
else
  cp "$ROOT/deploy/nginx/api.sms.matubyte.com.conf" /tmp/api.sms.matubyte.com.conf
  cp "$ROOT/deploy/nginx/matusms.matubyte.com.conf" /tmp/matusms.matubyte.com.conf
fi

# Ajustar puerto upstream en config API si no es 8000
if [[ "$PORT" != "8000" ]]; then
  sed -i "s/127.0.0.1:8000/127.0.0.1:$PORT/g" /tmp/api.sms.matubyte.com.conf
fi

cp /tmp/api.sms.matubyte.com.conf "$API_CONF"
cp /tmp/matusms.matubyte.com.conf "$WEB_CONF"
ln -sf "$API_CONF" /etc/nginx/sites-enabled/api.sms.matubyte.com
ln -sf "$WEB_CONF" /etc/nginx/sites-enabled/matusms.matubyte.com

nginx -t
systemctl reload nginx

echo ""
echo "✓ MatuSMS desplegado (aislado)"
echo "  PM2:  pm2 logs matusms-api"
echo "  API:  https://api.sms.matubyte.com/health"
echo "  Web:  https://matusms.matubyte.com"
