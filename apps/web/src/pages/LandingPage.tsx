import { Link } from '@tanstack/react-router';
import {
  Check,
  MessageSquare,
  Phone,
  Play,
  QrCode,
  Smartphone,
  Webhook,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PublicShell } from '@/components/marketing/PublicShell';
import { JsonLd, landingJsonLd } from '@/components/seo/JsonLd';

const journey = [
  {
    id: 'gateway',
    label: 'Gateway',
    accent: 'Android',
    title: 'como pasarela',
    body: 'Vincula cualquier teléfono con SIM. Escanea el QR desde la app y tu dispositivo queda listo para enviar y recibir SMS — sin operador de mensajería de por medio.',
    points: [
      'Vinculación por QR en segundos',
      'SIM 1 y SIM 2 en el mismo equipo',
      'Heartbeats para saber si el gateway está online',
      'Cola offline si el teléfono pierde señal',
    ],
    stats: [
      { value: '< 30s', label: 'para vincular' },
      { value: '2 SIM', label: 'por dispositivo' },
      { value: '24/7', label: 'heartbeat' },
    ],
    tags: ['App Android', 'QR link', 'Multi-SIM'],
    visual: 'gateway' as const,
  },
  {
    id: 'envio',
    label: 'Envío',
    accent: 'API',
    title: 'y panel en tiempo real',
    body: 'Dispara mensajes desde el dashboard o con un POST. Cola, reintentos y selección de SIM incluidos desde el primer request.',
    points: [
      'REST API con API keys por usuario',
      'Envío masivo CSV / Excel',
      'Schedules y plantillas OTP',
      'Estado delivered / failed en vivo',
    ],
    stats: [
      { value: '1 POST', label: 'para enviar' },
      { value: 'Bulk', label: 'CSV / XLSX' },
      { value: 'OTP', label: 'plantillas' },
    ],
    tags: ['REST API', 'Panel', 'Bulk CSV'],
    visual: 'envio' as const,
  },
  {
    id: 'recepcion',
    label: 'Recepción',
    accent: 'Hilos',
    title: 'por contacto',
    body: 'Los SMS entrantes llegan al instante vía FCM. Conversaciones organizadas por número, listas para soporte u OTP.',
    points: [
      'Push FCM + sondeo de respaldo',
      'Hilos por contacto en el panel',
      'Respuestas visibles en tiempo real',
      'Ideal para OTP y atención al cliente',
    ],
    stats: [
      { value: 'FCM', label: 'push vivo' },
      { value: 'Hilos', label: 'por número' },
      { value: 'Inbox', label: 'unificado' },
    ],
    tags: ['FCM', 'Hilos', 'Dual SIM'],
    visual: 'recepcion' as const,
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    accent: 'Eventos',
    title: 'firmados HMAC',
    body: 'Cada entrega, fallo o mensaje entrante llega a tu backend con firma verificable. Integra MatuSMS a tu stack sin polling.',
    points: [
      'Firma HMAC en cada evento',
      'delivered, failed e inbound',
      'Reintentos automáticos al endpoint',
      'Headers listos para verificar en tu API',
    ],
    stats: [
      { value: 'HMAC', label: 'firma' },
      { value: '3+', label: 'tipos de evento' },
      { value: '0', label: 'polling' },
    ],
    tags: ['HMAC', 'delivered', 'inbound'],
    visual: 'webhooks' as const,
  },
  {
    id: 'panel',
    label: 'Panel',
    accent: 'Todo',
    title: 'en un solo lugar',
    body: 'Teléfonos, claves, horarios, envío masivo y facturación. Un panel en español pensado para operar día a día.',
    points: [
      'Gestión de teléfonos y API keys',
      'Monitoreo de estado (heartbeats)',
      'Facturación y documentación API',
      'Búsqueda y filtros de mensajes',
    ],
    stats: [
      { value: 'ES', label: 'panel nativo' },
      { value: 'Keys', label: 'por usuario' },
      { value: 'Docs', label: 'integradas' },
    ],
    tags: ['Teléfonos', 'Schedules', 'Billing'],
    visual: 'panel' as const,
  },
];

const codeSnippets: Record<
  string,
  { label: string; lines: { type: 'comment' | 'code' | 'blank'; text: string }[] }
> = {
  curl: {
    label: 'cURL',
    lines: [
      { type: 'comment', text: '# Enviar un SMS con MatuSMS' },
      { type: 'code', text: 'curl -X POST https://api.matusms.com/v1/messages \\' },
      { type: 'code', text: '  -H "Authorization: Bearer $MATU_KEY" \\' },
      { type: 'code', text: '  -H "Content-Type: application/json" \\' },
      { type: 'code', text: '  -d \'{"to":"+573001234567","body":"Hola desde MatuSMS"}\'' },
    ],
  },
  node: {
    label: 'Node.js',
    lines: [
      { type: 'comment', text: '// fetch nativo en Node 18+' },
      { type: 'code', text: "const res = await fetch('https://api.matusms.com/v1/messages', {" },
      { type: 'code', text: "  method: 'POST'," },
      { type: 'code', text: '  headers: {' },
      { type: 'code', text: "    Authorization: `Bearer ${process.env.MATU_KEY}`," },
      { type: 'code', text: "    'Content-Type': 'application/json'," },
      { type: 'code', text: '  },' },
      { type: 'code', text: "  body: JSON.stringify({ to: '+573001234567', body: 'Hola' })," },
      { type: 'code', text: '});' },
    ],
  },
  python: {
    label: 'Python',
    lines: [
      { type: 'comment', text: '# pip install requests' },
      { type: 'code', text: 'import os, requests' },
      { type: 'blank', text: '' },
      { type: 'code', text: 'res = requests.post(' },
      { type: 'code', text: '    "https://api.matusms.com/v1/messages",' },
      { type: 'code', text: '    headers={"Authorization": f"Bearer {os.environ[\'MATU_KEY\']}"},' },
      { type: 'code', text: '    json={"to": "+573001234567", "body": "Hola"},' },
      { type: 'code', text: ')' },
    ],
  },
};

function HeroVisual() {
  return (
    <div className="matu-fade-up-delay relative aspect-[16/11] overflow-hidden rounded-2xl bg-ink shadow-xl ring-1 ring-black/5 lg:aspect-auto lg:min-h-[340px]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 60% at 70% 40%, rgba(255,255,255,0.07) 0%, transparent 55%), linear-gradient(160deg, #1a1a1a 0%, #0a0a0a 100%)',
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        <p className="text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          BUILT FOR
          <br />
          <span className="text-brand">WHAT NEXT</span>
        </p>
        <p className="mt-3 max-w-xs text-center text-sm text-neutral-400">
          Android gateway · API REST · Webhooks firmados
        </p>
        <button
          type="button"
          className="mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-white text-ink shadow-lg transition hover:scale-105"
          aria-label="Ver producto"
          onClick={() =>
            document.getElementById('plataforma')?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          <Play className="ml-0.5 h-6 w-6 fill-current" />
        </button>
      </div>
    </div>
  );
}

function JourneyVisual({ kind }: { kind: (typeof journey)[number]['visual'] }) {
  if (kind === 'gateway') {
    return (
      <div className="matu-visual-stage">
        <div
          className="matu-visual-stage__bg"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80)',
          }}
        />
        <div className="matu-visual-stage__scrim" />
        <div className="matu-visual-stage__grid" />
        <div className="relative z-10 flex h-full min-h-[220px] flex-col items-center justify-center gap-5 p-5 sm:min-h-[260px] lg:min-h-[320px]">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-white/20 bg-black/50 shadow-2xl backdrop-blur-sm sm:h-36 sm:w-36">
            <QrCode className="h-16 w-16 text-white sm:h-[4.5rem] sm:w-[4.5rem]" strokeWidth={1.25} />
            <div className="absolute inset-x-4 top-3 h-0.5 rounded-full bg-brand matu-scan-line" />
          </div>
          <div className="w-full max-w-xs rounded-xl border border-white/15 bg-black/65 p-3.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white">
                <Smartphone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Escanear para vincular</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 matu-pulse-dot" />
                  App Android · listo en segundos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'envio') {
    return (
      <div className="matu-visual-stage">
        <div
          className="matu-visual-stage__bg"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80)',
          }}
        />
        <div className="matu-visual-stage__scrim" />
        <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-center gap-3 p-5 sm:min-h-[260px] lg:min-h-[320px]">
          <div className="matu-float-soft ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm font-medium text-ink shadow-xl">
            Tu código OTP es <span className="font-bold text-brand">482193</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            Entregado · SIM 1 · 0.8s
          </div>
          <div className="mt-2 max-w-full overflow-x-auto rounded-xl border border-white/15 bg-black/70 px-4 py-3 font-mono text-[11px] leading-relaxed text-neutral-200 shadow-xl backdrop-blur sm:text-xs">
            <span className="text-brand">POST</span> /v1/messages
            <br />
            <span className="text-neutral-400">→</span> {'{ "status": "queued", "id": "msg_4821" }'}
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'recepcion') {
    return (
      <div className="matu-visual-stage">
        <div
          className="matu-visual-stage__bg"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80)',
            backgroundPosition: 'top center',
          }}
        />
        <div className="matu-visual-stage__scrim" />
        <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-end gap-3 p-5 sm:min-h-[260px] lg:min-h-[320px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Inbox en vivo</p>
          <div className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-ink shadow-xl">
            ¿Aún tienen stock del plan premium?
          </div>
          <div className="rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white shadow-xl backdrop-blur">
            <p className="mb-1 text-[11px] font-semibold text-brand">Respuesta en el panel</p>
            Hilo abierto con +57 300… · listo para responder
            <span className="mt-2 flex items-center gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-white/80 matu-typing-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/80 matu-typing-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/80 matu-typing-dot" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'webhooks') {
    return (
      <div className="matu-visual-stage">
        <div className="matu-visual-stage__grid" />
        <div className="matu-visual-stage__scrim" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,255,255,0.06), transparent 60%), #0a0a0a' }} />
        <div className="relative z-10 flex h-full min-h-[220px] items-center justify-center p-4 sm:min-h-[260px] lg:min-h-[320px]">
          <div className="matu-float-soft w-full max-w-md overflow-hidden rounded-xl border border-white/15 bg-ink-panel shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2.5">
              <span className="h-2 w-2 rounded-full bg-red-400/80" />
              <span className="h-2 w-2 rounded-full bg-amber-400/70" />
              <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
              <span className="ml-2 font-mono text-[10px] text-neutral-400">webhook.log</span>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 matu-pulse-dot" />
                live
              </span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-neutral-200 sm:text-xs">
              <span className="text-emerald-400">POST</span> /hooks/sms{'\n'}
              <span className="text-neutral-500">x-matu-signature: </span>
              <span className="text-sky-300">sha256=3f9a…</span>
              {'\n'}
              {'{\n'}
              {'  '}"event": <span className="text-brand">"delivered"</span>,{'\n'}
              {'  '}"to": <span className="text-amber-200">"+57300…"</span>,{'\n'}
              {'  '}"sim": <span className="text-amber-200">1</span>
              {'\n}'}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="matu-visual-stage">
      <div
        className="matu-visual-stage__bg"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80)',
        }}
      />
      <div className="matu-visual-stage__scrim" />
      <div className="relative z-10 flex h-full min-h-[200px] flex-col justify-center gap-3 p-4 sm:min-h-[240px] sm:p-5 lg:min-h-[280px]">
        <div className="rounded-xl border border-white/15 bg-black/65 p-4 shadow-xl backdrop-blur-md">
          <p className="text-xs font-medium text-neutral-300">Teléfonos activos</p>
          <p className="mt-1 text-2xl font-bold text-white">3 gateways</p>
          <p className="mt-1 text-xs text-neutral-400">Bogotá · Medellín · remoto</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/15 bg-black/65 p-4 shadow-xl backdrop-blur-md">
            <p className="text-xs font-medium text-neutral-300">Hoy</p>
            <p className="mt-1 text-xl font-bold text-brand">1.2k SMS</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black/65 p-4 shadow-xl backdrop-blur-md">
            <p className="text-xs font-medium text-neutral-300">Entrega</p>
            <p className="mt-1 text-xl font-bold text-white">99.1%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyStepContent({ step }: { step: (typeof journey)[number] }) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
        Plataforma · {step.label}
      </p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl lg:text-[2.75rem]">
        <span className="text-brand">{step.accent}</span> {step.title}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-base">
        {step.body}
      </p>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {step.points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-neutral-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
            {p}
          </li>
        ))}
      </ul>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        {step.stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-2.5 sm:px-3 sm:py-3"
          >
            <p className="text-base font-extrabold text-brand sm:text-xl">{s.value}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-neutral-500 sm:text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {step.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-ink sm:text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  );
}

function PlatformJourney() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const active = Math.min(
    journey.length - 1,
    Math.max(0, Math.round(progress * (journey.length - 1))),
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');

    const onScroll = () => {
      if (!mq.matches) return;
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(scrolled / total);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    mq.addEventListener('change', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mq.removeEventListener('change', onScroll);
    };
  }, []);

  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const top =
      window.scrollY + el.getBoundingClientRect().top + (i / (journey.length - 1)) * total;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  const translatePct = progress * (journey.length - 1) * 100;

  return (
    <>
      {/* Mobile / tablet: stacked — avoids sticky carousel overflow */}
      <section
        id="plataforma"
        className="border-y border-neutral-200 bg-white py-12 sm:py-16 lg:hidden"
      >
        <div className="mx-auto max-w-7xl space-y-14 px-4 sm:space-y-16 sm:px-6">
          {journey.map((step, i) => (
            <article key={step.id} className="scroll-mt-20">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Paso {i + 1} de {journey.length}
                </span>
              </div>
              <JourneyStepContent step={step} />
              <div className="mt-6">
                <JourneyVisual kind={step.visual} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Desktop: scroll-driven horizontal journey */}
      <section
        id="plataforma-desktop"
        ref={trackRef}
        className="relative hidden bg-white lg:block"
        style={{ height: `${journey.length * 100}vh` }}
        aria-labelledby="plataforma"
      >
        <div
          className="sticky top-0 flex h-screen flex-col overflow-hidden border-y border-neutral-200 bg-white"
          role="region"
          aria-roledescription="carrusel"
          aria-label="Recorrido de la plataforma MatuSMS"
        >
          <div className="flex min-h-0 flex-1 flex-col pt-[4.25rem]">
            <p className="sr-only" aria-live="polite">
              Paso {active + 1} de {journey.length}: {journey[active].label}
            </p>
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div
                className="flex h-full will-change-transform"
                style={{
                  width: `${journey.length * 100}%`,
                  transform: `translate3d(-${translatePct / journey.length}%, 0, 0)`,
                }}
              >
                {journey.map((step) => (
                  <div
                    key={step.id}
                    className="flex h-full shrink-0 items-stretch overflow-hidden"
                    style={{ width: `${100 / journey.length}%` }}
                  >
                    <div className="mx-auto grid h-full w-full max-w-7xl grid-cols-2 content-center gap-10 overflow-hidden px-8 py-8">
                      <div className="flex min-w-0 flex-col justify-center">
                        <JourneyStepContent step={step} />
                      </div>
                      <div className="min-h-0 min-w-0 overflow-hidden">
                        <JourneyVisual kind={step.visual} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 border-t border-neutral-200 bg-white px-8 pb-4 pt-4">
              <div className="relative mx-auto max-w-7xl">
                <div className="relative flex justify-between gap-1">
                  <div className="pointer-events-none absolute left-[6%] right-[6%] top-[2.2rem] h-px bg-neutral-200" />
                  <div
                    className="pointer-events-none absolute top-[2.2rem] h-0.5 bg-brand transition-[width] duration-150"
                    style={{ left: '6%', width: `${progress * 88}%` }}
                  />
                  {journey.map((item, i) => {
                    const isActive = i === active;
                    const isDone = i < active;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={isActive ? 'step' : undefined}
                        aria-label={`Ir al paso ${item.label}`}
                        className="relative z-10 flex min-h-11 flex-1 cursor-pointer flex-col items-center gap-2.5 text-center"
                      >
                        <span
                          className={`text-sm font-semibold ${
                            isActive ? 'text-ink' : 'text-neutral-400'
                          }`}
                        >
                          {item.label}
                        </span>
                        <span
                          className={`flex h-8 w-8 rotate-45 items-center justify-center rounded-md transition duration-200 ${
                            isActive
                              ? 'bg-brand text-white shadow-md shadow-brand/30'
                              : isDone
                                ? 'border-2 border-brand bg-white text-transparent'
                                : 'border border-neutral-300 bg-white text-transparent'
                          }`}
                        >
                          <span className="-rotate-45">
                            {isActive ? <Phone className="h-3.5 w-3.5" /> : null}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-center text-xs text-neutral-400">
                  Scroll para avanzar · o toca un paso
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function BuildingBlocks() {
  return (
    <section id="bloques" className="bg-neutral-50 py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Building blocks para cada mensaje
          </h2>
          <p className="mt-2 text-sm text-neutral-600 sm:text-base">
            Gateway físico, API y panel. OTP, alertas y soporte sobre tu SIM.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <article className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="rounded-xl bg-neutral-50 p-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  JD
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">+57 300 555 0142</p>
                  <p className="text-xs text-emerald-600">Entregado · positivo</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <MessageSquare className="h-3.5 w-3.5 text-brand" />
                  SMS saliente · OTP
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Smartphone className="h-3.5 w-3.5 text-brand" />
                  Respuesta entrante · hilo
                </div>
              </div>
            </div>
            <h3 className="mt-4 flex items-center gap-2 text-lg font-bold text-ink">
              Panel
              <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                vivo
              </span>
            </h3>
            <p className="mt-1.5 text-sm text-neutral-600">
              Hilos por contacto, estado de entrega y multi-SIM en español.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="rounded-xl bg-neutral-50 p-3.5">
              <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-neutral-200">
                {['SMS', 'Bulk', 'OTP', '…'].map((t, i) => (
                  <span
                    key={t}
                    className={`flex-1 rounded-full px-2 py-1 text-center text-[11px] font-semibold ${
                      i === 0 ? 'bg-brand text-white' : 'text-neutral-400'
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-2.5 overflow-hidden rounded-lg ring-1 ring-neutral-200">
                <div
                  className="h-20 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80)',
                  }}
                />
                <div className="bg-white p-2.5">
                  <p className="text-sm font-semibold text-ink">Recordatorio de cita</p>
                  <p className="text-xs text-neutral-500">Mañana 10:00 · responde SI</p>
                </div>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-bold text-ink">Messaging</h3>
            <p className="mt-1.5 text-sm text-neutral-600">
              Envía y recibe SMS. Bulk, schedules y cola offline.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="relative space-y-2 py-1 pl-3">
              <div className="absolute bottom-2 left-[0.95rem] top-2 w-px bg-brand/40" />
              {['Trigger: SMS delivered', 'Verificar HMAC', 'Actualizar CRM'].map((label, i) => (
                <div
                  key={label}
                  className={`relative rounded-lg border px-3 py-2 text-xs ${
                    i === 2
                      ? 'border-ink bg-ink font-semibold text-white'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                  }`}
                >
                  <span
                    className={`absolute -left-[0.85rem] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                      i === 2 ? 'bg-brand' : 'bg-brand/50'
                    }`}
                  />
                  {i === 2 ? (
                    <span className="flex items-center gap-2">
                      <Webhook className="h-3.5 w-3.5 text-brand" />
                      {label}
                    </span>
                  ) : (
                    label
                  )}
                </div>
              ))}
            </div>
            <h3 className="mt-4 text-lg font-bold text-ink">Webhooks</h3>
            <p className="mt-1.5 text-sm text-neutral-600">
              Eventos firmados a tu backend. Sin polling.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function DevelopersSection() {
  const [lang, setLang] = useState<keyof typeof codeSnippets>('python');
  const snippet = codeSnippets[lang];

  return (
    <section id="developers" className="bg-ink py-14 text-white sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            Desarrollar. Sin límites.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
            Un POST y tu mensaje sale por la SIM. Webhooks firmados te avisan cuando llega o falla.
          </p>
          <Link
            to="/register"
            search={{ redirect: undefined }}
            className="mt-5 inline-flex rounded-full border border-white/35 px-5 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/5"
          >
            Ver documentación
          </Link>
        </div>

        <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-ink-panel">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 px-2 py-1.5">
            {(Object.keys(codeSnippets) as (keyof typeof codeSnippets)[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setLang(key)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                  lang === key ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'
                }`}
              >
                {codeSnippets[key].label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 overflow-x-auto p-4 font-mono text-[12px] leading-6 sm:p-5 sm:text-[13px]">
            <div className="select-none text-right text-neutral-600">
              {snippet.lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre className="text-neutral-200">
              {snippet.lines.map((line, i) => (
                <div key={i}>
                  {line.type === 'comment' ? (
                    <span className="text-neutral-500">{line.text}</span>
                  ) : line.type === 'blank' ? (
                    '\u00a0'
                  ) : (
                    <CodeLine text={line.text} />
                  )}
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function CodeLine({ text }: { text: string }) {
  const parts = text.split(/('(?:\\'|[^'])*'|"(?:\\"|[^"])*")/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("'") || part.startsWith('"')) {
          return (
            <span key={i} className="text-sky-300">
              {part}
            </span>
          );
        }
        if (
          /^(import|from|const|await|requests\.|curl)/.test(part.trim()) ||
          part.includes('POST')
        ) {
          return (
            <span key={i} className="text-brand">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function SocialProof() {
  const stories = [
    {
      metric: '10k+',
      label: 'SMS por hora con un Android',
      image:
        'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=700&q=80',
      alt: 'Equipo trabajando con mensajería móvil para OTP',
      tag: 'OTP',
    },
    {
      metric: '99%',
      label: 'entregas vía webhook',
      image:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=700&q=80',
      alt: 'Colaboración en equipo de soporte al cliente',
      tag: 'Soporte',
    },
    {
      metric: '2 SIM',
      label: 'en el mismo gateway',
      image:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80',
      alt: 'Persona usando smartphone como gateway SMS',
      tag: 'Multi-SIM',
    },
    {
      metric: '0',
      label: 'operadores SMS de terceros',
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=700&q=80',
      alt: 'Reunión de producto sobre infraestructura propia',
      tag: 'Gateway',
    },
  ];

  return (
    <section className="bg-white py-14 sm:py-16" aria-labelledby="proof-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 id="proof-heading" className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Distintos equipos. Una misma pasarela.
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              OTP, alertas y soporte sobre tu propia SIM — sin intermediario de mensajería.
            </p>
          </div>
          <Link
            to="/register"
            search={{ redirect: undefined }}
            className="inline-flex shrink-0 self-start rounded-full border border-ink px-5 py-2 text-sm font-semibold text-ink transition hover:bg-neutral-50"
          >
            Probar gratis
          </Link>
        </div>

        <div className="mt-8 -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:snap-none">
          {stories.map((s) => (
            <article
              key={s.tag}
              className="relative min-w-[85%] flex-none snap-center overflow-hidden rounded-2xl sm:min-w-[240px] lg:min-w-0 lg:flex-1"
            >
              <img
                src={s.image}
                alt={s.alt}
                width={700}
                height={440}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/25" />
              <div className="relative flex min-h-[220px] flex-col justify-end p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                  {s.tag}
                </p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-brand">{s.metric}</p>
                <p className="mt-1 text-sm text-white/90">{s.label}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    question: '¿Qué es MatuSMS?',
    answer:
      'MatuSMS es una pasarela SMS SaaS que convierte un teléfono Android con SIM en gateway. Puedes enviar y recibir SMS por API REST o panel web, con webhooks firmados HMAC.',
  },
  {
    question: '¿Necesito un operador SMS de terceros?',
    answer:
      'No. Los mensajes salen por la SIM de tu Android. MatuSMS orquesta cola, estado, multi-SIM y eventos hacia tu backend.',
  },
  {
    question: '¿Puedo usar dos SIM en el mismo teléfono?',
    answer:
      'Sí. La app Android soporta SIM 1 y SIM 2. Eliges la línea al enviar desde el panel o la API.',
  },
  {
    question: '¿Cómo se integran los webhooks?',
    answer:
      'Configuras una URL HTTPS. MatuSMS envía eventos (delivered, failed, inbound) con cabecera de firma HMAC para que verifiques la autenticidad.',
  },
  {
    question: '¿Hay prueba gratuita?',
    answer:
      'Sí. Puedes crear una cuenta y empezar sin tarjeta de crédito. Los precios se adaptan al volumen cuando escalas.',
  },
  {
    question: '¿El panel está en español?',
    answer:
      'Sí. El dashboard, la documentación de uso y los flujos principales están pensados en español para operar día a día.',
  },
];

function Benefits() {
  const items = [
    {
      title: 'Tu SIM, tu control',
      desc: 'Sin depender de un agregador SMS. El tráfico sale de tu dispositivo con costos de tu línea.',
    },
    {
      title: 'API lista para producción',
      desc: 'Autenticación por API key, cola, reintentos y estados claros para integrar OTP o alertas.',
    },
    {
      title: 'Eventos confiables',
      desc: 'Webhooks HMAC para entregas e inbound. Tu backend se entera sin polling constante.',
    },
    {
      title: 'Operación en español',
      desc: 'Panel, hilos y monitoreo pensados para equipos que trabajan en Latinoamérica.',
    },
  ];

  return (
    <section id="beneficios" className="border-y border-neutral-200 bg-neutral-50 py-14 sm:py-16" aria-labelledby="beneficios-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 id="beneficios-heading" className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Por qué equipos eligen MatuSMS
          </h2>
          <p className="mt-2 text-sm text-neutral-600 sm:text-base">
            Beneficios concretos para OTP, notificaciones y soporte — sin complejidad de carrier.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/register"
            search={{ redirect: undefined }}
            className="inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Crear cuenta
          </Link>
          <a
            href="#faq"
            className="inline-flex rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-neutral-50"
          >
            Más información
          </a>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="bg-white py-14 sm:py-16" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 id="faq-heading" className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Preguntas frecuentes
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Respuestas directas para entender MatuSMS antes de registrarte.
        </p>
        <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
          {faqs.map((f) => (
            <details key={f.question} className="group py-4">
              <summary className="cursor-pointer list-none text-left text-base font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {f.question}
                  <span className="text-brand transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function MidCta() {
  return (
    <aside className="border-y border-brand/20 bg-brand-light py-8" aria-label="Llamado a la acción">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <p className="text-lg font-bold text-ink">Empieza a enviar SMS con tu Android hoy</p>
          <p className="mt-1 text-sm text-neutral-600">Cuenta gratis · sin tarjeta · listo en minutos</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/register"
            search={{ redirect: undefined }}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Comenzar ahora
          </Link>
          <a
            href="mailto:contacto@matubyte.com"
            className="rounded-lg border border-brand/40 bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-white"
          >
            Contactar
          </a>
        </div>
      </div>
    </aside>
  );
}

export function LandingPage() {
  return (
    <PublicShell ctaLabel="Comenzar">
      <JsonLd data={landingJsonLd(faqs)} />

      <section id="producto" className="relative overflow-hidden bg-white" aria-labelledby="hero-heading">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-16">
          <div>
            <p className="matu-fade-up text-sm font-semibold tracking-wide text-brand">MatuSMS</p>
            <h1
              id="hero-heading"
              className="matu-fade-up-delay mt-2 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]"
            >
              Pasarela SMS con API REST y Android Gateway
            </h1>
            <p className="matu-fade-up-delay-2 mt-4 max-w-lg text-[15px] leading-relaxed text-neutral-600 sm:text-base">
              Conecta tu SIM y tu backend en una plataforma flexible. Envía, recibe y automatiza SMS
              sin depender de un operador de mensajería.
            </p>
            <div className="matu-fade-up-delay-2 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                search={{ redirect: undefined }}
                className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Comenzar gratis
              </Link>
              <a
                href="#plataforma"
                className="text-sm font-semibold text-ink underline decoration-neutral-300 underline-offset-4 transition hover:decoration-brand"
              >
                Ver cómo funciona
              </a>
            </div>
            <ul className="matu-fade-up-delay-2 mt-6 space-y-2">
              {['Prueba gratuita', 'No se requiere tarjeta de crédito', 'Precios flexibles'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-neutral-700">
                    <Check className="h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      <PlatformJourney />
      <MidCta />
      <BuildingBlocks />
      <Benefits />
      <DevelopersSection />
      <SocialProof />
      <FaqSection />

      <section className="border-t border-neutral-200 bg-brand py-12 sm:py-14" aria-labelledby="final-cta-heading">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 id="final-cta-heading" className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Empieza en minutos
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
            Crea tu cuenta, vincula tu Android y envía tu primer SMS con MatuSMS.
          </p>
          <Link
            to="/register"
            search={{ redirect: undefined }}
            className="mt-5 inline-flex rounded-lg bg-white px-7 py-3 text-sm font-semibold text-brand transition hover:bg-neutral-100"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
