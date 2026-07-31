#!/usr/bin/env bash
# Instalación inicial del servidor Ubuntu 22.04 / 24.04
# Ejecutar como root o con sudo: bash deploy/scripts/install-server.sh
set -euo pipefail

echo "==> MatuSMS — instalación de dependencias del servidor"

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y curl git nginx certbot python3-certbot-nginx build-essential

# Node.js 22 (NodeSource)
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# pnpm
if ! command -v pnpm &>/dev/null; then
  corepack enable
  corepack prepare pnpm@11.18.0 --activate
fi

# PM2
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
  pm2 startup systemd -u "${SUDO_USER:-$USER}" --hp "/home/${SUDO_USER:-$USER}"
fi

# Redis (opcional local; en producción también puedes usar Upstash)
if ! command -v redis-server &>/dev/null; then
  apt-get install -y redis-server
  systemctl enable redis-server
  systemctl start redis-server
fi

# Carpetas
mkdir -p /var/www/matusms/logs
mkdir -p /var/www/certbot
chown -R "${SUDO_USER:-$USER}:${SUDO_USER:-$USER}" /var/www/matusms

# Nginx — quitar sitio default si existe
rm -f /etc/nginx/sites-enabled/default

echo ""
echo "✓ Dependencias instaladas."
echo "  Node: $(node -v)"
echo "  pnpm: $(pnpm -v)"
echo "  PM2:  $(pm2 -v)"
echo ""
echo "Siguiente paso: clonar el repo en /var/www/matusms y seguir docs/deployment.md"
