import { Link } from '@tanstack/react-router';
import { MessageSquare, Shield, Smartphone, Zap } from 'lucide-react';
import type { ReactNode } from 'react';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="marketing-bg flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between border-r border-white/60 bg-white/40 p-10 backdrop-blur-sm lg:flex">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-semibold text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/25">
            <MessageSquare className="h-5 w-5" />
          </span>
          MatuSMS
        </Link>

        <div className="space-y-8">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-light px-3 py-1 text-xs font-semibold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Pasarela SMS profesional
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900">
              Controla cada mensaje desde un solo panel
            </h1>
            <p className="mt-4 max-w-md text-slate-600">
              Convierte tu Android en gateway SMS. Envía, recibe y automatiza con API, webhooks y
              multi-SIM.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Smartphone, text: 'Registra teléfonos desde la app Android' },
              { icon: Zap, text: 'Mensajes en tiempo real con FCM y cola offline' },
              { icon: Shield, text: 'API keys, webhooks firmados y panel seguro' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-slate-700">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">© {new Date().getFullYear()} MatuStudio · MatuDB ecosystem</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="mb-6 inline-flex items-center gap-2 font-semibold text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
                <MessageSquare className="h-5 w-5" />
              </span>
              MatuSMS
            </Link>
          </div>

          <div className="rounded-[1.75rem] border border-white/80 bg-white/85 p-8 shadow-[0_24px_60px_-20px_rgba(59,111,245,0.18)] backdrop-blur-md">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
            {children}
            <div className="mt-6">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
