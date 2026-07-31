# Despliegue en producción — MatuSMS

Guía para levantar MatuSMS en un servidor Linux (Ubuntu 22.04/24.04) con **PM2**, **Nginx** y **Let's Encrypt**.

| Servicio | Subdominio | Puerto interno |
|----------|------------|----------------|
| **API** (Fastify + Socket.IO) | `https://api.sms.matubyte.com` | `8000` (solo localhost) |
| **Dashboard** (React/Vite estático) | `https://matusms.matubyte.com` | Nginx sirve `apps/web/dist` |

> **Tu servidor:** si el prompt es `root@servidor:~/apps/MatuSMS#`, ya estás en la raíz correcta.  
> Equivalente: `/root/apps/MatuSMS` = `~/apps/MatuSMS`

### Siguiente paso (desde donde estás)

```bash
# Ya en ~/apps/MatuSMS — instalar dependencias del servidor (solo la primera vez)
chmod +x deploy/scripts/*.sh
bash deploy/scripts/install-server.sh

# Configurar .env de las apps
cd apps
cp ../deploy/env/api.production.env.example api/.env
cp ../deploy/env/web.production.env.example web/.env
nano api/.env
nano web/.env

# Build y PM2 (volver a la raíz del repo)
cd ~/apps/MatuSMS
pnpm install --frozen-lockfile
pnpm build:prod
mkdir -p logs
export MATUSMS_ROOT=~/apps/MatuSMS
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

## Estructura en el servidor

Las aplicaciones viven dentro de la carpeta **`apps/`**. El monorepo se clona en la raíz; los comandos de build se ejecutan desde ahí, y la configuración de cada app desde `apps/`:

```
~/apps/MatuSMS/                  ← raíz del repo (= /root/apps/MatuSMS)
├── apps/
│   ├── api/                   ← API (Fastify) — .env y PM2
│   │   ├── .env
│   │   ├── dist/
│   │   └── service-account.json
│   └── web/                   ← Dashboard (Vite) — .env y build
│       ├── .env
│       └── dist/              ← Nginx sirve esta carpeta
├── packages/shared/
├── deploy/                    ← PM2, Nginx, scripts
└── logs/                      ← logs de PM2
```

**Regla rápida:**

| Acción | Dónde ejecutar |
|--------|----------------|
| `pnpm install`, `pnpm build:prod`, `git pull`, scripts `deploy/` | Raíz: `cd ~/apps/MatuSMS` |
| Editar `.env`, subir `service-account.json` | Apps: `cd ~/apps/MatuSMS/apps` |

---

## 1. Requisitos previos

### En tu DNS (matubyte.com)

Crea registros **A** (o **CNAME**) apuntando a la IP pública del servidor:

| Registro | Tipo | Valor |
|----------|------|-------|
| `api.sms` | A | `IP_DEL_SERVIDOR` |
| `matusms` | A | `IP_DEL_SERVIDOR` |

Espera la propagación DNS (puede tardar unos minutos). Verifica:

```bash
dig +short api.sms.matubyte.com
dig +short matusms.matubyte.com
```

### En el servidor

- Ubuntu 22.04 o 24.04 (recomendado)
- Usuario con `sudo`
- Puertos **80** y **443** abiertos en el firewall
- Acceso SSH

### Servicios externos

- **MatuDB** — proyecto creado y schema aplicado (`scripts/matudb-production-schema.sql`)
- **Firebase** — proyecto con Auth + FCM
- **Redis 7+** — local en el servidor o [Upstash](https://upstash.com) (recomendado para producción)

---

## 2. Instalación inicial del servidor (una sola vez)

Conéctate por SSH y ejecuta:

```bash
mkdir -p ~/apps
cd ~/apps
git clone <URL_DE_TU_REPO> MatuSMS
cd MatuSMS
chmod +x deploy/scripts/*.sh
bash deploy/scripts/install-server.sh
```

El script instala: **Node.js 22**, **pnpm**, **PM2**, **Nginx**, **Certbot**, **Redis** (opcional local).

---

## 3. Clonar el proyecto (si aún no lo hiciste)

```bash
mkdir -p ~/apps
cd ~/apps
git clone <URL_DE_TU_REPO> MatuSMS
cd MatuSMS
chmod +x deploy/scripts/*.sh
```

---

## 4. Variables de entorno

Entra a la carpeta de las apps:

```bash
cd ~/apps/MatuSMS/apps
```

### API — `api/.env`

```bash
cp ../deploy/env/api.production.env.example api/.env
nano api/.env
```

Valores críticos:

```env
NODE_ENV=production
PORT=8000
MATUDB_PROJECT_ID=tu-proyecto
MATUDB_API_KEY=tu-api-key
REDIS_URL=redis://127.0.0.1:6379
CORS_ORIGIN=https://matusms.matubyte.com
API_PUBLIC_URL=https://api.sms.matubyte.com
FIREBASE_SERVICE_ACCOUNT_PATH=/root/apps/MatuSMS/apps/api/service-account.json
```

Sube el JSON de Firebase al servidor:

```bash
# Desde tu PC (ejemplo con scp)
scp service-account.json usuario@tu-servidor:/root/apps/MatuSMS/apps/api/service-account.json
chmod 600 /root/apps/MatuSMS/apps/api/service-account.json
```

### Dashboard — `web/.env`

```bash
cd ~/apps/MatuSMS/apps
cp ../deploy/env/web.production.env.example web/.env
nano web/.env
```

```env
VITE_API_BASE_URL=https://api.sms.matubyte.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=...
# ... resto de variables Firebase
```

> **Importante:** Las variables `VITE_*` se compilan en el build. Si las cambias, vuelve a la raíz y ejecuta `pnpm build:prod`.

### Firebase — dominios autorizados

En [Firebase Console](https://console.firebase.google.com) → **Authentication** → **Settings** → **Authorized domains**, agrega:

- `matusms.matubyte.com`

---

## 5. Build y arranque de la API con PM2

Desde la **raíz del repo** (no desde `apps/`):

```bash
cd ~/apps/MatuSMS

# Instalar dependencias (monorepo: api + web + packages/shared)
pnpm install --frozen-lockfile

# Compilar shared + API + web
pnpm build:prod

# Crear carpeta de logs
mkdir -p logs

# Iniciar API con PM2 (corre apps/api/dist/index.js)
export MATUSMS_ROOT=~/apps/MatuSMS
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

Comandos útiles de PM2:

```bash
pm2 status                  # estado
pm2 logs matusms-api        # logs en vivo
pm2 restart matusms-api     # reiniciar
pm2 reload matusms-api      # reload sin downtime
pm2 save                    # persistir tras reinicio del servidor
```

Verificar que la API responde localmente:

```bash
curl http://127.0.0.1:8000/health
```

---

## 6. Nginx — subdominios

### Paso A: Configuración bootstrap (solo HTTP, para obtener SSL)

Antes de tener certificados, usa las configs temporales:

```bash
cd ~/apps/MatuSMS
NGINX_BOOTSTRAP=1 bash deploy/scripts/setup-nginx.sh
```

### Paso B: Certificados SSL con Let's Encrypt

```bash
sudo mkdir -p /var/www/certbot

# Certificado para la API
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.sms.matubyte.com \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email

# Certificado para el dashboard
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d matusms.matubyte.com \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email
```

### Paso C: Activar configuración HTTPS definitiva

```bash
cd ~/apps/MatuSMS
NGINX_BOOTSTRAP=0 bash deploy/scripts/setup-nginx.sh
```

### Verificar Nginx

```bash
sudo nginx -t
sudo systemctl status nginx
```

Prueba en el navegador:

- https://api.sms.matubyte.com/health
- https://api.sms.matubyte.com/docs
- https://matusms.matubyte.com

### Renovación automática de certificados

Certbot instala un timer systemd. Comprueba:

```bash
sudo certbot renew --dry-run
```

---

## 7. Despliegues posteriores (actualizar código)

Cada vez que subas cambios al repositorio:

```bash
cd ~/apps/MatuSMS
bash deploy/scripts/deploy.sh
```

Esto hace: `git pull` → `pnpm install` → `pnpm build:prod` → `pm2 reload` → `nginx reload`.

Variables opcionales:

```bash
MATUSMS_ROOT=~/apps/MatuSMS MATUSMS_BRANCH=main bash deploy/scripts/deploy.sh
```

---

## 8. Estructura de archivos de despliegue

```
~/apps/MatuSMS/
├── apps/
│   ├── api/                      # API — .env, dist/, service-account.json
│   └── web/                      # Dashboard — .env, dist/ (Nginx)
├── packages/shared/              # tipos compartidos (build previo)
├── deploy/
│   ├── ecosystem.config.cjs      # PM2 — solo API
│   ├── nginx/
│   │   ├── api.sms.matubyte.com.conf
│   │   ├── matusms.matubyte.com.conf
│   │   └── bootstrap/            # HTTP temporal para certbot
│   ├── env/
│   │   ├── api.production.env.example
│   │   └── web.production.env.example
│   └── scripts/
│       ├── install-server.sh
│       ├── setup-nginx.sh
│       └── deploy.sh
└── logs/                         # logs PM2
```

---

## 9. App Android (Flutter)

En la app Android (`C:\dev\matusms`), el servidor por defecto y los QR deben apuntar a:

- **API:** `https://api.sms.matubyte.com`

La API genera QR con `API_PUBLIC_URL` del `.env`. Asegúrate de que esté configurado correctamente.

---

## 10. Checklist de producción

- [ ] DNS: `api.sms.matubyte.com` y `matusms.matubyte.com` → IP del servidor
- [ ] `apps/api/.env` con MatuDB, Redis, Firebase y `API_PUBLIC_URL`
- [ ] `apps/web/.env` con `VITE_API_BASE_URL=https://api.sms.matubyte.com`
- [ ] Schema MatuDB aplicado
- [ ] `pnpm build:prod` sin errores
- [ ] PM2: `matusms-api` en estado `online`
- [ ] Nginx: certificados SSL válidos
- [ ] `curl https://api.sms.matubyte.com/health` → OK
- [ ] Login en `https://matusms.matubyte.com` funciona
- [ ] Firebase: dominio `matusms.matubyte.com` autorizado
- [ ] Redis 7+ o Upstash activo (colas SMS/webhooks)

---

## 11. Solución de problemas

### API no arranca (PM2)

```bash
pm2 logs matusms-api --lines 100
```

Causas frecuentes: `.env` incompleto, Firebase JSON no encontrado, MatuDB credentials inválidas.

### 502 Bad Gateway en la API

- La API no está corriendo: `pm2 status`
- Puerto incorrecto: debe escuchar en `8000` (`curl http://127.0.0.1:8000/health`)

### Dashboard en blanco o 404 en rutas

- Falta el build: desde la raíz, `cd ~/apps/MatuSMS && pnpm build:prod`
- Verifica que exista `apps/web/dist/index.html`
- Nginx sin `try_files` SPA — usa la config de `deploy/nginx/matusms.matubyte.com.conf`

### CORS / login falla

- `CORS_ORIGIN` en API debe ser exactamente `https://matusms.matubyte.com` (sin barra final)
- `VITE_API_BASE_URL` debe ser `https://api.sms.matubyte.com`

### WebSockets / tiempo real

La config de Nginx incluye proxy para `/socket.io/`. Si hay problemas, revisa:

```bash
sudo tail -f /var/log/nginx/matusms-api.error.log
```

### Redis / colas deshabilitadas

Si ves en logs: `Redis < 5.0 detected — BullMQ workers disabled`, instala Redis 7+ o usa Upstash:

```bash
redis-server --version   # debe ser >= 7
```

---

## 12. Firewall (UFW) — opcional

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

No expongas el puerto `8000` públicamente; solo Nginx debe ser la entrada.

---

## Resumen de comandos rápidos

```bash
# Primera vez — raíz del repo
cd ~/apps/MatuSMS
bash deploy/scripts/install-server.sh

# Variables de entorno — carpeta apps
cd apps
cp ../deploy/env/api.production.env.example api/.env
cp ../deploy/env/web.production.env.example web/.env
nano api/.env
nano web/.env
# subir service-account.json a apps/api/

# Build y PM2 — volver a la raíz
cd ~/apps/MatuSMS
pnpm install && pnpm build:prod
pm2 start deploy/ecosystem.config.cjs && pm2 save

# Nginx + SSL — desde la raíz
NGINX_BOOTSTRAP=1 bash deploy/scripts/setup-nginx.sh
# certbot (ver sección 6)
NGINX_BOOTSTRAP=0 bash deploy/scripts/setup-nginx.sh

# Actualizaciones — desde la raíz
cd ~/apps/MatuSMS
bash deploy/scripts/deploy.sh
```
