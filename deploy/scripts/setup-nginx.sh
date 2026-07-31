#!/usr/bin/env bash
# Instala los sitios Nginx de MatuSMS (requiere sudo)
set -euo pipefail

ROOT="${MATUSMS_ROOT:-/root/apps/MatuSMS}"
BOOTSTRAP="${NGINX_BOOTSTRAP:-0}"

echo "==> Instalando configuración Nginx"

if [[ "$BOOTSTRAP" == "1" ]]; then
  echo "    Modo bootstrap (solo HTTP, para certbot)"
  sudo cp "$ROOT/deploy/nginx/bootstrap/api.sms.matubyte.com.http.conf" \
    /etc/nginx/sites-available/api.sms.matubyte.com
  sudo cp "$ROOT/deploy/nginx/bootstrap/matusms.matubyte.com.http.conf" \
    /etc/nginx/sites-available/matusms.matubyte.com
else
  echo "    Modo producción (HTTP + HTTPS)"
  sudo cp "$ROOT/deploy/nginx/api.sms.matubyte.com.conf" \
    /etc/nginx/sites-available/api.sms.matubyte.com
  sudo cp "$ROOT/deploy/nginx/matusms.matubyte.com.conf" \
    /etc/nginx/sites-available/matusms.matubyte.com
fi

sudo ln -sf /etc/nginx/sites-available/api.sms.matubyte.com /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/matusms.matubyte.com /etc/nginx/sites-enabled/

sudo mkdir -p /var/www/certbot
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx

echo "✓ Nginx configurado."
