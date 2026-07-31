import { Link } from '@tanstack/react-router';
import { MessageSquare } from 'lucide-react';
import type { ReactNode } from 'react';

type PublicShellProps = {
  children: ReactNode;
  ctaHref?: '/register' | '/login';
  ctaLabel?: string;
};

export function PublicShell({ children, ctaHref = '/register', ctaLabel = 'Comenzar gratis' }: PublicShellProps) {
  return (
    <div className="marketing-bg min-h-screen overflow-x-hidden">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <div className="marketing-glass mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 rounded-full border border-white/60 px-3 shadow-[0_8px_32px_-8px_rgba(59,111,245,0.2)] sm:px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-bold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-md shadow-brand/30">
              <MessageSquare className="h-4 w-4" />
            </span>
            <span className="hidden text-sm sm:inline">MatuSMS</span>
          </Link>

          <nav className="hidden items-center gap-0.5 rounded-full border border-slate-100 bg-white/90 px-1 py-0.5 shadow-sm md:flex">
            {[
              { href: '/#showcase', label: 'Producto' },
              { href: '/#features', label: 'Funciones' },
              { href: '/#api', label: 'API' },
            ].map(({ href, label }) => (
              <a
                key={label}
                href={href}
                className="rounded-full px-4 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/login"
              search={{ redirect: undefined }}
              className="hidden rounded-full px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 sm:inline-flex"
            >
              Iniciar sesión
            </Link>
            <Link
              to={ctaHref}
              search={{ redirect: undefined }}
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand/30 transition hover:bg-brand-dark sm:px-5"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24">{children}</main>

      <footer className="border-t border-white/50 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} MatuStudio · MatuDB ecosystem</p>
        <Link to="/legal" className="mt-1 inline-block text-brand hover:underline">
          Términos y privacidad
        </Link>
      </footer>
    </div>
  );
}
