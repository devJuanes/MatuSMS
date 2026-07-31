# Nginx — MatuSMS

Estos archivos se copian automáticamente a `/etc/nginx/sites-available/` con:

```bash
bash deploy/scripts/deploy.sh
# o solo nginx:
bash deploy/scripts/setup-nginx.sh
```

## Sitios

| Archivo | Dominio | Backend |
|---------|---------|---------|
| `api.sms.matubyte.com.conf` | `api.sms.matubyte.com` | Proxy → `127.0.0.1:8000` (PM2) |
| `matusms.matubyte.com.conf` | `matusms.matubyte.com` | Estático → `/var/www/matusms-web` |

## Importante: frontend en `/var/www/matusms-web`

Nginx (`www-data`) **no puede leer** archivos dentro de `/root/`.  
Por eso el build de Vite se publica en `/var/www/matusms-web` (lo hace `deploy.sh`).

**No edites** `/etc/nginx/sites-available/matusms.matubyte.com` a mano — cambia este archivo en el repo y ejecuta `git pull` + `bash deploy/scripts/deploy.sh`.
