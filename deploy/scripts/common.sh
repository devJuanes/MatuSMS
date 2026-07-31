#!/usr/bin/env bash
# Funciones compartidas — MatuSMS deploy (solo este proyecto)
set -euo pipefail

: "${MATUSMS_ROOT:=/root/apps/MatuSMS}"
: "${MATUSMS_API_PORT:=8000}"
: "${MATUSMS_WEB_PUBLIC_DIR:=/var/www/matusms-web}"
: "${NGINX_BOOTSTRAP:=0}"

matusms_fix_env() {
  local root="$MATUSMS_ROOT"
  local port="$MATUSMS_API_PORT"
  local fb_path="$root/apps/api/service-account.json"

  cd "$root"

  [[ -f apps/api/.env ]] || { echo "✗ Falta apps/api/.env"; exit 1; }
  [[ -f apps/web/.env ]]  || { echo "✗ Falta apps/web/.env"; exit 1; }

  if grep -q '^PORT=' apps/api/.env; then
    sed -i "s/^PORT=.*/PORT=$port/" apps/api/.env
  else
    echo "PORT=$port" >> apps/api/.env
  fi

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

  if grep -q '^FIREBASE_SERVICE_ACCOUNT_PATH=' apps/api/.env; then
    sed -i "s|^FIREBASE_SERVICE_ACCOUNT_PATH=.*|FIREBASE_SERVICE_ACCOUNT_PATH=$fb_path|" apps/api/.env
  else
    echo "FIREBASE_SERVICE_ACCOUNT_PATH=$fb_path" >> apps/api/.env
  fi

  if grep -q '^VITE_API_BASE_URL=' apps/web/.env; then
    sed -i 's|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=https://api.sms.matubyte.com|' apps/web/.env
  else
    echo 'VITE_API_BASE_URL=https://api.sms.matubyte.com' >> apps/web/.env
  fi

  if [[ ! -f "$fb_path" ]]; then
    echo "✗ Falta Firebase: $fb_path"
    echo "  Sube el archivo: scp service-account.json root@TU_IP:$fb_path"
    exit 1
  fi
}

matusms_publish_web() {
  local root="$MATUSMS_ROOT"
  local public_dir="$MATUSMS_WEB_PUBLIC_DIR"

  [[ -f "$root/apps/web/dist/index.html" ]] || {
    echo "✗ Falta build del frontend. Ejecuta: pnpm build:prod"
    exit 1
  }

  echo "==> Publicar frontend → $public_dir"
  mkdir -p "$public_dir"
  rsync -a --delete "$root/apps/web/dist/" "$public_dir/"
  chown -R www-data:www-data "$public_dir" 2>/dev/null || true
}

matusms_install_nginx() {
  local root="$MATUSMS_ROOT"
  local port="$MATUSMS_API_PORT"
  local api_conf="/etc/nginx/sites-available/api.sms.matubyte.com"
  local web_conf="/etc/nginx/sites-available/matusms.matubyte.com"

  echo "==> Nginx (solo api.sms + matusms.matubyte.com)"

  if [[ "$NGINX_BOOTSTRAP" == "1" ]]; then
    cp "$root/deploy/nginx/bootstrap/api.sms.matubyte.com.http.conf" /tmp/api.sms.matubyte.com.conf
    cp "$root/deploy/nginx/bootstrap/matusms.matubyte.com.http.conf" /tmp/matusms.matubyte.com.conf
  else
    cp "$root/deploy/nginx/api.sms.matubyte.com.conf" /tmp/api.sms.matubyte.com.conf
    cp "$root/deploy/nginx/matusms.matubyte.com.conf" /tmp/matusms.matubyte.com.conf
  fi

  if [[ "$port" != "8000" ]]; then
    sed -i "s/127.0.0.1:8000/127.0.0.1:$port/g" /tmp/api.sms.matubyte.com.conf
  fi

  cp /tmp/api.sms.matubyte.com.conf "$api_conf"
  cp /tmp/matusms.matubyte.com.conf "$web_conf"
  ln -sf "$api_conf" /etc/nginx/sites-enabled/api.sms.matubyte.com
  ln -sf "$web_conf" /etc/nginx/sites-enabled/matusms.matubyte.com

  mkdir -p /var/www/certbot
  nginx -t
  systemctl reload nginx
}

matusms_start_pm2() {
  local root="$MATUSMS_ROOT"
  local port="$MATUSMS_API_PORT"

  echo "==> PM2 matusms-api (puerto $port)"
  export MATUSMS_ROOT="$root"
  mkdir -p "$root/logs"

  local tmp_ecosystem
  tmp_ecosystem="$(mktemp)"
  sed "s/PORT: 8000/PORT: $port/" "$root/deploy/ecosystem.config.cjs" > "$tmp_ecosystem"

  if pm2 describe matusms-api &>/dev/null; then
    pm2 delete matusms-api 2>/dev/null || true
  fi
  pm2 start "$tmp_ecosystem"
  rm -f "$tmp_ecosystem"
  pm2 save

  sleep 2
  if curl -sf "http://127.0.0.1:$port/health" >/dev/null; then
    echo "✓ API OK en :$port/health"
  else
    echo "⚠ API no responde en :$port — revisa: pm2 logs matusms-api"
  fi
}
