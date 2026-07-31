# MatuSMS

**MatuSMS** converts an Android phone into an SMS gateway controlled by HTTP API. Part of the **MatuDB** ecosystem.

- **MatuSMS API** — Node.js + Fastify 5 (`apps/api`)
- **MatuSMS Dashboard** — React 19 + Vite 6 (`apps/web`)
- **MatuSMS App** — Flutter Android gateway (`apps/mobile` or separate repo at `C:\dev\matusms`)

## Prerequisites

- Node.js 22+
- pnpm 9+
- Redis (local Windows service, brew, apt, or [Upstash](https://upstash.com))
- Flutter 3.x + Android Studio (for mobile app)
- Firebase project (Auth + FCM)
- MatuDB project with schema applied

**No Docker** — everything runs natively or on managed cloud services.

## Quick start

```bash
pnpm install
```

> **pnpm 11:** Native build scripts are allowed via `allowBuilds` in `pnpm-workspace.yaml` (esbuild, protobufjs, etc.). If install fails with `ERR_PNPM_IGNORED_BUILDS`, ensure that file is present and not edited with placeholder text.

```bash
# Configure API
cp apps/api/.env.example apps/api/.env
# Edit: MATUDB_PROJECT_ID, MATUDB_API_KEY, REDIS_URL, FIREBASE_SERVICE_ACCOUNT_PATH

# Configure Dashboard
cp apps/web/.env.example apps/web/.env
# Edit: VITE_FIREBASE_*, VITE_API_BASE_URL

# Apply database schema in MatuDB SQL editor
# scripts/matudb-production-schema.sql
# scripts/matudb-production-seed.sql
```

### Start Redis (Windows example)

```powershell
Get-Service Redis
Start-Service Redis
# REDIS_URL=redis://localhost:6379
```

Or use Upstash:

```env
REDIS_URL=rediss://default:xxx@your-upstash.upstash.io:6379
```

### Run services

```bash
pnpm dev:api    # MatuSMS API → http://localhost:8000
pnpm dev:web    # MatuSMS Dashboard → http://localhost:3000
```

PowerShell scripts:

```powershell
.\scripts\run-api.ps1
.\scripts\run-web.ps1
.\scripts\check-deps.ps1
```

### MatuSMS Android app

```bash
cd C:\dev\matusms   # or apps/mobile when linked
flutter pub get
flutter run
# Release APK:
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk → rename to MatuSMS.apk
```

Emulator API URL: `http://10.0.2.2:8000`

## API docs

OpenAPI UI: http://localhost:8000/docs

Health check: http://localhost:8000/health

### Operations (Phase 6)

| Endpoint | Description |
|----------|-------------|
| `GET/POST/PUT/DELETE /v1/webhooks` | Webhook CRUD + HMAC signing |
| `GET/POST/PUT/DELETE /v1/schedules` | Send time windows |
| `POST /v1/messages/bulk-send` | Bulk CSV/async (202) |
| `GET /v1/bulk-messages` | Bulk job status |
| `GET /v1/messages/search?q=` | Search messages & threads |
| `GET /v1/billing/usage` | Monthly message counts |
| `GET /v1/heartbeats/monitors` | Phone online/offline status |

Workers (Redis): `message-send`, `message-expire-check`, `webhook-dispatch`, `bulk-process`, `schedule-dispatch` (1 min), `heartbeat-check` (5 min offline threshold).

### Phase 7 — Security & polish

| Feature | Details |
|---------|---------|
| **Attachments** | `POST /v1/attachments` (multipart, max 5MB) → MatuDB storage |
| **E2E encryption** | Optional AES-style XOR+base64; key in browser/Android secure storage only |
| **Turnstile** | `POST /v1/auth/verify-turnstile` + widget on login (`VITE_TURNSTILE_SITE_KEY`) |
| **LemonSqueezy** | `POST /v1/billing/webhooks/lemonsqueezy` updates subscription |
| **OpenAPI** | `GET /openapi.json` + Scalar UI at `/docs` |
| **Schedule enforcement** | Auto-schedules sends outside phone window |
| **Flutter offline** | Hive queue for receive/events when network down |
| **FCM + Workmanager** | Push trigger + 15min background fallback |
| **APK** | `flutter build apk --release` → `MatuSMS.apk` |

## Authentication

| Client | Method |
|--------|--------|
| Dashboard | Firebase JWT `Authorization: Bearer <token>` |
| Integrations | `x-api-key: <user.api_key>` |
| MatuSMS App | `x-api-key: <phone_api_key>` |

## Project structure

```
matusms/
├── apps/
│   ├── api/          # MatuSMS API
│   └── web/          # MatuSMS Dashboard
├── packages/
│   └── shared/       # Zod schemas + types
├── scripts/          # Native setup scripts + SQL
└── docs/
    └── matudb.md     # MatuDB client reference
```

## Branding

| Item | Value |
|------|-------|
| Product | **MatuSMS** |
| App ID | `com.matudb.matusms` |
| System email | `system@matusms.com` |
| Support | `support@matusms.com` |

## Production deployment

Subdominios de producción:

| Servicio | URL |
|----------|-----|
| API | `https://api.sms.matubyte.com` |
| Dashboard | `https://matusms.matubyte.com` |

Guía completa (PM2, Nginx, SSL, certbot): **[docs/deployment.md](docs/deployment.md)**

En el servidor: raíz del repo en `~/apps/MatuSMS` (`/root/apps/MatuSMS`); apps en `apps/api` y `apps/web`.

Archivos en `deploy/`:

- `ecosystem.config.cjs` — PM2 para la API
- `nginx/` — configs para ambos subdominios
- `scripts/deploy.sh` — actualizar en el servidor

## License

Proprietary — MatuStudio / MatuDB ecosystem.
