#!/usr/bin/env bash
# Solo instala/actualiza Nginx de MatuSMS desde el repo (sin build ni PM2)
set -euo pipefail

export MATUSMS_ROOT="${MATUSMS_ROOT:-/root/apps/MatuSMS}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

matusms_install_nginx
echo "✓ Nginx MatuSMS actualizado desde deploy/nginx/"
