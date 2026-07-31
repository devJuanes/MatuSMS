# Deploy — MatuSMS

Las apps están en **`apps/api`** y **`apps/web`**. Los scripts de build y deploy se ejecutan desde la **raíz del repo**.

| Archivo | Descripción |
|---------|-------------|
| `ecosystem.config.cjs` | PM2 — API en `apps/api` (puerto 8000) |
| `nginx/api.sms.matubyte.com.conf` | Reverse proxy API + WebSockets |
| `nginx/matusms.matubyte.com.conf` | Dashboard → `/var/www/matusms-web` |
| `nginx/bootstrap/*.conf` | HTTP temporal para certbot |
| `env/*.example` | Plantillas `.env` → copiar a `apps/api/.env` y `apps/web/.env` |
| `scripts/common.sh` | Lógica compartida (env, nginx, pm2, publish web) |
| `scripts/install-server.sh` | Setup inicial Ubuntu |
| `scripts/setup-nginx.sh` | Solo actualizar Nginx desde el repo |
| `scripts/deploy.sh` | **Un comando:** pull + build + nginx + pm2 |

**Guía completa:** [docs/deployment.md](../docs/deployment.md)

## URLs de producción

- API: `https://api.sms.matubyte.com`
- Web: `https://matusms.matubyte.com`
