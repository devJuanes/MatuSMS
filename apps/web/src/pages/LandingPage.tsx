import { Link } from '@tanstack/react-router';
import {
  ArrowRight,
  Check,
  MessageSquare,
  Radio,
  Send,
  Shield,
  Smartphone,
  Webhook,
  Zap,
} from 'lucide-react';
import { PublicShell } from '@/components/marketing/PublicShell';

const features = [
  { icon: Send, title: 'Envío instantáneo', desc: 'SMS desde el panel o API REST con cola y reintentos.' },
  { icon: Radio, title: 'Recepción en vivo', desc: 'FCM + sondeo. Hilos por contacto en tiempo real.' },
  { icon: Smartphone, title: 'Multi-SIM', desc: 'SIM 1 y SIM 2 desde la app Android.' },
  { icon: Webhook, title: 'Webhooks HMAC', desc: 'Eventos firmados a tu backend.' },
  { icon: Shield, title: 'Acceso seguro', desc: 'Firebase Auth y API keys por usuario.' },
  { icon: Zap, title: 'Automatización', desc: 'Bulk CSV, schedules y monitoreo.' },
];

/**
 * Signature element: the actual mechanic of the product — an Android phone
 * physically sending an SMS, wired to a terminal receiving the signed
 * webhook. This replaces the generic "friendly bot + chat bubbles" motif
 * with the thing MatuSMS literally does.
 */
function PhoneToWebhook() {
  return (
    <div className="relative flex flex-col items-center gap-0 sm:flex-row sm:items-stretch sm:justify-center sm:gap-0">
      {/* Phone */}
      <div className="relative z-10 w-[168px] shrink-0 rounded-[2rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/20">
        <div className="flex items-center justify-between px-4 pb-1 pt-2 text-[9px] font-medium text-white/70">
          <span>9:41</span>
          <span className="flex items-center gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            SIM 1
          </span>
        </div>
        <div className="min-h-[190px] space-y-1.5 rounded-[1.1rem] bg-white px-2.5 py-3">
          <p className="px-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            +57 300 555 0142
          </p>
          <div className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-brand px-2.5 py-1.5 text-[10px] font-medium leading-snug text-white">
            Tu pedido #4821 va en camino 🚚
          </div>
          <div className="flex items-center gap-1 text-[9px] text-slate-400">
            <Check className="h-2.5 w-2.5 text-brand" />
            Entregado · SIM 1
          </div>
        </div>
      </div>

      {/* Connector */}
      <div className="relative flex h-8 w-full items-center justify-center sm:h-auto sm:w-14">
        <div className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-slate-300 sm:inset-x-0 sm:inset-y-6 sm:h-auto sm:w-px sm:border-t-0 sm:border-l" />
        <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-[10px] text-slate-400">
          →
        </span>
      </div>

      {/* Terminal */}
      <div className="w-[220px] shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-left shadow-2xl shadow-slate-900/20">
        <div className="flex items-center gap-1.5 border-b border-slate-800 bg-slate-900 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-red-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          <span className="ml-2 text-[9px] text-slate-500">webhook.log</span>
        </div>
        <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[9.5px] leading-relaxed text-slate-300">
          <span className="text-emerald-400">POST</span> /webhooks/sms{'\n'}
          <span className="text-slate-500">x-matu-signature: </span>
          <span className="text-sky-400">3f9a…c1</span>
          {'\n'}
          {'{'}
          {'\n'} {'  '}
          <span className="text-slate-500">"status"</span>: <span className="text-emerald-400">"delivered"</span>
          ,{'\n'} {'  '}
          <span className="text-slate-500">"sim"</span>: <span className="text-amber-300">1</span>
          {'\n'}
          {'}'}
        </pre>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <PublicShell ctaLabel="Probar gratis">
      {/* ── HERO ── */}
      <section className="relative mx-auto max-w-4xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-20">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand-light/80 px-4 py-1.5 text-xs font-medium text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Pasarela SMS · Ecosistema MatuDB
        </p>

        <h1 className="text-[2.1rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
          Tu Android ya puede enviar
          <br />
          diez mil SMS antes del almuerzo.
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-sm text-slate-500 sm:text-base">
          Convierte cualquier teléfono con SIM en una pasarela SMS con API REST,
          webhooks firmados y panel en español. Sin operador SMS de por medio.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            search={{ redirect: undefined }}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white shadow-xl shadow-brand/35 transition hover:bg-brand-dark hover:shadow-brand/40"
          >
            Probar gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#showcase"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Ver demo
          </a>
        </div>
      </section>

      {/* ── SHOWCASE ── */}
      <section id="showcase" className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl border border-slate-100 bg-slate-50/60 px-6 py-12 sm:px-10">
          <div className="mx-auto mb-10 max-w-md text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Cómo funciona</p>
            <h2 className="mt-1.5 text-xl font-bold text-slate-900 sm:text-2xl">
              El teléfono envía. Tu backend se entera.
            </h2>
          </div>
          <PhoneToWebhook />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <MessageSquare className="h-4 w-4 text-brand" />
            <h3 className="mt-3 text-sm font-bold text-slate-900">Panel en español</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Hilos por contacto, selector de país y estado de entrega en tiempo real.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <Smartphone className="h-4 w-4 text-brand" />
            <h3 className="mt-3 text-sm font-bold text-slate-900">Vinculación por QR</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Escanea el código desde la app Android y tu API key queda lista al instante.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <Webhook className="h-4 w-4 text-brand" />
            <h3 className="mt-3 text-sm font-bold text-slate-900">Webhooks firmados</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Cada evento llega a tu backend con firma HMAC verificable.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Todo lo que necesitas</h2>
            <p className="mt-2 text-sm text-slate-500">Infraestructura SMS lista para producción</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-brand/30"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="api" className="pb-20 pt-4">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="rounded-3xl border border-slate-100 bg-slate-50/60 px-8 py-12">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">¿Listo para empezar?</h2>
            <p className="mt-3 text-sm text-slate-500">
              Crea tu cuenta, vincula tu Android y envía tu primer SMS en minutos.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                search={{ redirect: undefined }}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand/30 hover:bg-brand-dark"
              >
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                search={{ redirect: undefined }}
                className="text-sm font-medium text-brand hover:underline"
              >
                Ya tengo cuenta →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}