import { Link } from '@tanstack/react-router';
import { Check, MessageSquare, Shield, Smartphone } from 'lucide-react';
import type { ReactNode } from 'react';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

const points = [
  'Android gateway con QR en segundos',
  'API REST + webhooks firmados HMAC',
  'Panel en español · multi-SIM',
];

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-ink p-10 text-white xl:w-[48%] lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 50% at 80% 0%, rgba(255,255,255,0.06) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 10% 100%, rgba(255,255,255,0.03) 0%, transparent 50%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <Link
          to="/"
          className="matu-fade-up relative z-10 flex items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <img
            src="/favicon.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="text-xl font-extrabold tracking-tight">
            Matu<span className="text-brand">SMS</span>
          </span>
        </Link>

        <div className="relative z-10 space-y-10">
          <div className="matu-fade-up-delay">
            <h1 className="max-w-md text-3xl font-extrabold leading-[1.15] tracking-tight xl:text-[2.5rem]">
              Pasarela SMS profesional para tu Android
            </h1>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-neutral-400">
              Envía, recibe y automatiza con tu propia SIM — API, cola y eventos firmados.
            </p>
          </div>

          {/* Product snapshot */}
          <div className="matu-fade-up-delay-2 overflow-hidden rounded-2xl border border-white/10 bg-ink-panel/80 shadow-2xl shadow-black/40 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand" />
                <span className="text-xs font-medium text-white/80">Gateway online</span>
              </div>
              <span className="font-mono text-[10px] text-white/40">SIM 1 · Bogotá</span>
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-4 w-4 text-brand" />
                  <div>
                    <p className="text-xs font-medium text-white/90">OTP enviado</p>
                    <p className="text-[11px] text-white/40">+57 300… · 0.8s</p>
                  </div>
                </div>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">
                  delivered
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="h-4 w-4 text-neutral-400" />
                  <div>
                    <p className="text-xs font-medium text-white/90">Inbound recibido</p>
                    <p className="text-[11px] text-white/40">Hilo abierto en el panel</p>
                  </div>
                </div>
                <span className="rounded bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-300">
                  live
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2.5">
                <Shield className="h-4 w-4 text-neutral-400" />
                <p className="text-xs text-white/70">Webhook HMAC · event delivered</p>
              </div>
            </div>
          </div>

          <ul className="matu-fade-up-delay-2 space-y-2.5">
            {points.map((text) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-neutral-300">
                <Check className="h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-neutral-500">
          © {new Date().getFullYear()} MatuByte S.A.S. · Ecosistema MatuDB
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-ink">
              <img
                src="/favicon.png"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg object-contain"
              />
              <span>
                Matu<span className="text-brand">SMS</span>
              </span>
            </Link>
          </div>

          <div className="matu-fade-up mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.75rem]">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">{subtitle}</p>
          </div>

          <div className="matu-fade-up-delay">{children}</div>
          <div className="matu-fade-up-delay-2 mt-8">{footer}</div>
        </div>
      </div>
    </div>
  );
}
