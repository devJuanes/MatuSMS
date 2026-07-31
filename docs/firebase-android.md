# Firebase / FCM — App Android MatuSMS

Sin Firebase Cloud Messaging (FCM) la app **no puede recibir push** cuando envías SMS desde el dashboard. El teléfono depende del **poll cada 10 s** (lento) y verás **"Sin FCM"** en la web.

## 1. Crear proyecto Firebase

1. Abre [Firebase Console](https://console.firebase.google.com/).
2. Crea un proyecto (o usa uno existente).
3. Agrega una app **Android** con package name: `com.matudb.matusms`.
4. Descarga `google-services.json`.

## 2. Colocar archivos en el repo Flutter

```text
C:\dev\matusms\android\app\google-services.json   ← obligatorio
```

El plugin de Google Services ya está en `android/app/build.gradle`. Tras agregar el archivo:

```bash
cd C:\dev\matusms
flutter clean
flutter pub get
flutter run
```

## 3. Service account en el API (servidor)

El API envía push con Firebase Admin. En el servidor (`~/apps/MatuSMS/apps/api/.env`):

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

O pega el JSON en una sola línea:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Obtén la clave en Firebase → Project settings → Service accounts → Generate new private key.

**Importante:** el proyecto Firebase del service account debe ser el **mismo** que el de `google-services.json`.

## 4. Verificar

1. Abre la app Android y vincula el dispositivo de nuevo (o reinicia la app).
2. En el dashboard → **Teléfonos**, debe decir **Conectado** (no "Sin FCM").
3. En el servidor: `pm2 logs matusms-api` — al enviar un SMS deberías ver:
   - `Message enqueued for delivery`
   - `FCM push sent for new message` (si hay token)
4. Si no hay token: `FCM push skipped — no token on phone`.

## 5. Logs útiles en producción

```bash
pm2 logs matusms-api --lines 100
```

| Log | Significado |
|-----|-------------|
| `FCM push skipped — no token` | App sin Firebase o sin registrar token |
| `Message enqueued for delivery` | SMS creado en cola |
| `Message claimed for sending` | Teléfono tomó el mensaje (sin duplicar) |
| `Message event applied` + `SENT` | Enviado correctamente |
| `Message claim rejected` | Otro proceso ya lo envió (anti-duplicado) |
| `FCM token invalid — cleared` | Reinstala app o vuelve a vincular |

## 6. Re-vincular tras configurar Firebase

Si configuraste Firebase **después** de vincular el teléfono:

1. En la app: Cierra sesión y vuelve a iniciar sesión con tu API Key, **o**
2. Solo mata y abre la app (registra token en `FcmService.init`).
