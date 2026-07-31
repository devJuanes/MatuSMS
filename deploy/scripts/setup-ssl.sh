#!/usr/bin/env bash
# Obtiene certificados Let's Encrypt y activa Nginx HTTPS para MatuSMS.
#
# Uso en el servidor (como root o con sudo):
#   cd ~/apps/MatuSMS
#   CERTBOT_EMAIL=tu@email.com bash deploy/scripts/setup-ssl.sh
#
# Requiere: nginx activo, DNS apuntando a este servidor, puertos 80/443 abiertos.
set -euo pipefail

export MATUSMS_ROOT="${MATUSMS_ROOT:-/root/apps/MatuSMS}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

EMAIL="${CERTBOT_EMAIL:-}"
DOMAINS=(api.sms.matubyte.com matusms.matubyte.com)

if [[ -z "$EMAIL" ]]; then
  echo "✗ Define CERTBOT_EMAIL, por ejemplo:"
  echo "  CERTBOT_EMAIL=admin@matubyte.com bash deploy/scripts/setup-ssl.sh"
  exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
  echo "==> Instalando certbot"
  apt-get update -qq
  apt-get install -y certbot
fi

echo "==> Bootstrap Nginx HTTP (para validación ACME)"
export NGINX_BOOTSTRAP=1
matusms_install_nginx

mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot 2>/dev/null || true

for domain in "${DOMAINS[@]}"; do
  if matusms_has_ssl "$domain"; then
    echo "✓ Certificado ya existe: $domain"
    continue
  fi
  echo "==> Certbot: $domain"
  certbot certonly --webroot \
    -w /var/www/certbot \
    -d "$domain" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive
done

echo "==> Aplicar Nginx HTTPS"
export NGINX_BOOTSTRAP=0
matusms_install_nginx

if command -v systemctl >/dev/null 2>&1; then
  systemctl enable certbot.timer 2>/dev/null || true
  systemctl start certbot.timer 2>/dev/null || true
fi

echo ""
echo "✓ SSL configurado"
echo "  https://matusms.matubyte.com"
echo "  https://api.sms.matubyte.com/health"
echo ""
echo "Verifica:"
echo "  curl -sI https://matusms.matubyte.com | head -3"
