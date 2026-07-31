# MatuSMS — Plan de negocio

## 1. Resumen ejecutivo

MatuSMS es una plataforma **SaaS de mensajería SMS** que convierte teléfonos Android con SIM en **gateways de envío**, combinando un **dashboard web**, **API REST** y **app Android**. El modelo permite a negocios, desarrolladores y agencias enviar OTP, notificaciones, campañas y mensajes transaccionales sin contratar un agregador SMS tradicional de alto costo, usando infraestructura propia (teléfonos + SIM prepago o corporativas).

**Propuesta de valor:** SMS con costo de SIM local, control de plantillas, multi-SIM, webhooks y escalabilidad por colas — ideal para Latinoamérica (Colombia, México, etc.).

---

## 2. Problema

| Actor | Problema |
|-------|----------|
| Startups / apps | OTP y notificaciones vía Twilio/MessageBird son caros por mensaje |
| Agencias | Campañas SMS masivas con poca personalización local |
| Negocios sin dev | Necesitan enviar sin integrar API compleja |
| Operaciones | Múltiples líneas SIM sin panel centralizado |

---

## 3. Solución (producto)

| Componente | Función |
|------------|---------|
| **App Android** | Gateway: envía/recibe SMS, dual SIM, segundo plano, FCM |
| **Dashboard web** | Mensajería tipo chat, envío masivo CSV/Excel, plantillas |
| **API REST** | `POST /v1/messages/send` con plantillas `{{codigo}}`, bulk, webhooks |
| **Colas (Redis/BullMQ)** | Desacopla picos de envío; el teléfono procesa a su ritmo |
| **MatuDB** | Usuarios, mensajes, facturación, teléfonos |

---

## 4. Mercado objetivo

### Primario (MVP)
- Desarrolladores en LATAM que necesitan **OTP / verificación**
- Pequeñas agencias de marketing SMS
- Negocios con 1–5 teléfonos Android dedicados

### Secundario
- SaaS white-label para resellers
- Integradores ERP / facturación (recordatorios de pago)

### Geografía
- Colombia (MVP), México, Perú, Argentina — prefijo +57, +52, etc. ya en UI

---

## 5. Modelo de ingresos

| Plan | Precio orientativo | Incluye |
|------|-------------------|---------|
| **Free** | $0 | 100 SMS/mes, 1 teléfono, API limitada |
| **Pro** | $19–29 USD/mes | 5.000 SMS, 3 teléfonos, webhooks |
| **Ultra** | $79+ USD/mes | 20k+ SMS, bulk, soporte prioritario |
| **Pay-as-you-go** | Por paquete SMS | Para picos sin plan mensual |

**Costo real del cliente:** SIM + plan de datos (~$5–15 USD/mes por línea) + suscripción MatuSMS.

**Margen:** La plataforma no paga al carrier por SMS — el cliente usa su SIM. El margen es software + soporte + infra (API, Redis, hosting).

Monetización adicional:
- Onboarding asistido (setup gateway)
- Plantillas premium (OTP, facturas, campañas)
- API dedicada / SLA empresarial

---

## 6. Go-to-market

### Fase 1 — Validación (0–3 meses)
1. Landing `matusms.matubyte.com` + SEO (OTP, gateway SMS Colombia)
2. Docs API + video “Android como gateway en 5 minutos”
3. 10–20 beta users (devs conocidos, WhatsApp comunidades)
4. Caso de uso claro: **código de verificación**

### Fase 2 — Tracción (3–9 meses)
1. Integración LemonSqueezy / pagos (ya en repo)
2. Plantillas marketplace en dashboard
3. Programa referidos (20% primer mes)
4. Contenido: comparativa vs Twilio en LATAM

### Fase 3 — Escala (9–18 meses)
1. Multi-tenant resellers
2. App iOS (limitada) o partners hardware
3. Certificaciones / compliance SMS local si aplica

---

## 7. Ventaja competitiva

| vs Agregadores (Twilio, etc.) | vs Apps gateway genéricas |
|------------------------------|---------------------------|
| Costo por SMS ≈ costo SIM | Dashboard + API unificada |
| Números locales reales | Colas SaaS, multi-usuario |
| Dual SIM nativo | Plantillas, webhooks, MatuDB |

**Diferenciador técnico:** FCM + servicio nativo en segundo plano + colas BullMQ — no depende de tener la app abierta.

---

## 8. Operaciones e infraestructura

| Recurso | Uso |
|---------|-----|
| VPS (API + Nginx) | `api.sms.matubyte.com` |
| Redis / Upstash | Colas BullMQ |
| MatuDB | Datos multi-tenant |
| Firebase | Auth web + FCM Android |
| Teléfonos Android | 1+ por cliente (gateway físico) |

**SLA realista:** Entrega depende de red móvil y teléfono online; comunicar “best effort” en free, SLA en planes altos.

---

## 9. Métricas clave (KPIs)

- SMS enviados / entregados / fallidos
- Tiempo medio: dashboard → SMS en dispositivo (objetivo &lt; 5 s con FCM)
- Teléfonos activos (heartbeat)
- MRR, churn, SMS por usuario
- Conversión free → pro

---

## 10. Roadmap producto (alineado al código)

| Prioridad | Entrega |
|-----------|---------|
| ✅ Hecho | Gateway Android, dashboard mensajes, bulk CSV, FCM |
| ✅ Reciente | Segundo plano nativo, chats en app, colas mejoradas |
| **Siguiente** | API pública documentada (Scalar), plantillas OTP en UI |
| **Q+1** | Campañas programadas, A/B mensajes, analytics |
| **Q+2** | Verificación dominio, rate limits por plan, white-label |

---

## 11. Riesgos y mitigación

| Riesgo | Mitigación |
|--------|------------|
| Políticas carrier / spam | Límites por minuto, plantillas, opt-in |
| Teléfono offline | Heartbeats, alertas, múltiples gateways |
| OEM mata background | Foreground service + battery exemption + FCM |
| Mismo número dual SIM | Validación envío / eco filtrado |
| Competencia precio | Enfoque LATAM + costo SIM local |

---

## 12. Finanzas simplificadas (ejemplo año 1)

**Asunciones:** 200 usuarios pagos a $25/mes promedio = **$5.000 MRR** → **$60k ARR**

Costos mensuales estimados:
- Infra (VPS, Redis, MatuDB): $150–400
- Firebase / dominio: $50
- Soporte part-time: variable

**Punto de equilibrio:** ~30–50 clientes pro según infra y soporte.

---

## 13. Próximos pasos inmediatos

1. Desplegar fixes de segundo plano y colas en producción
2. Documentar API OTP (`POST /send` + plantilla) en landing
3. Activar planes LemonSqueezy y límites por `subscription_name`
4. 5 demos con negocios locales (restaurantes, clínicas, apps)
5. Medir latencia end-to-end y publicar en landing

---

*Documento interno MatuByte — revisar trimestralmente.*
