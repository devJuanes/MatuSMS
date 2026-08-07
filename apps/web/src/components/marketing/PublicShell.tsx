import { Link } from '@tanstack/react-router';
import { ChevronDown, Mail, Menu, MessageCircle, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

type PublicShellProps = {
  children: ReactNode;
  ctaHref?: '/register' | '/login';
  ctaLabel?: string;
};

const navLinks = [
  { href: '/#producto', label: 'Producto' },
  { href: '/#plataforma', label: 'Plataforma' },
  { href: '/#bloques', label: 'Soluciones' },
  { href: '/#developers', label: 'API' },
  { href: '/#faq', label: 'FAQ' },
];

export function PublicShell({ children, ctaHref = '/register', ctaLabel = 'Comenzar' }: PublicShellProps) {
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const menuId = useId();
  const contactId = useId();
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!contactOpen) return;
    function onPointer(e: MouseEvent) {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setContactOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setContactOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [contactOpen]);

  return (
    <div className="marketing-bg min-h-screen">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:h-[4.25rem] lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-4 lg:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label="MatuSMS — inicio"
          >
            <img
              src="/favicon.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="text-xl font-extrabold tracking-tight text-ink sm:text-[1.35rem]">
              Matu<span className="text-brand">SMS</span>
            </span>
          </Link>

          <nav className="hidden items-center justify-center gap-1 lg:flex" aria-label="Principal">
            {navLinks.map(({ href, label }) => (
              <a
                key={label}
                href={href}
                className="cursor-pointer rounded-md px-3.5 py-2 text-sm font-medium text-neutral-600 transition duration-200 hover:bg-neutral-100 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <div className="relative hidden md:block" ref={contactRef}>
              <button
                type="button"
                className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition duration-200 hover:bg-neutral-100 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                aria-expanded={contactOpen}
                aria-controls={contactId}
                onClick={() => setContactOpen((v) => !v)}
              >
                Contacto
                <ChevronDown
                  className={`h-3.5 w-3.5 transition duration-200 ${contactOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {contactOpen ? (
                <div
                  id={contactId}
                  className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1.5 shadow-lg"
                  role="menu"
                >
                  <a
                    href="mailto:contacto@matubyte.com"
                    role="menuitem"
                    className="flex cursor-pointer items-start gap-3 px-3.5 py-2.5 transition hover:bg-neutral-50"
                    onClick={() => setContactOpen(false)}
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>
                      <span className="block text-sm font-medium text-ink">Email</span>
                      <span className="block text-xs text-neutral-500">contacto@matubyte.com</span>
                    </span>
                  </a>
                  <a
                    href="https://wa.me/573332771764"
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    className="flex cursor-pointer items-start gap-3 px-3.5 py-2.5 transition hover:bg-neutral-50"
                    onClick={() => setContactOpen(false)}
                  >
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>
                      <span className="block text-sm font-medium text-ink">WhatsApp</span>
                      <span className="block text-xs text-neutral-500">+57 333 277 1764</span>
                    </span>
                  </a>
                </div>
              ) : null}
            </div>

            <Link
              to="/login"
              search={{ redirect: undefined }}
              className="hidden cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition duration-200 hover:bg-neutral-100 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:inline-flex"
            >
              Iniciar sesión
            </Link>

            <Link
              to={ctaHref}
              search={{ redirect: undefined }}
              className="hidden cursor-pointer rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:inline-flex sm:px-5"
            >
              {ctaLabel}
            </Link>

            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-ink lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <div id={menuId} className="border-t border-neutral-200 bg-white px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-0.5" aria-label="Móvil">
              {navLinks.map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="cursor-pointer rounded-lg px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-50"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </a>
              ))}
              <div className="my-2 border-t border-neutral-100" />
              <a
                href="mailto:contacto@matubyte.com"
                className="cursor-pointer rounded-lg px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-50"
                onClick={() => setOpen(false)}
              >
                Email · contacto@matubyte.com
              </a>
              <a
                href="https://wa.me/573332771764"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer rounded-lg px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-50"
                onClick={() => setOpen(false)}
              >
                WhatsApp · +57 333 277 1764
              </a>
              <Link
                to="/login"
                search={{ redirect: undefined }}
                className="cursor-pointer rounded-lg px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-50"
                onClick={() => setOpen(false)}
              >
                Iniciar sesión
              </Link>
              <Link
                to={ctaHref}
                search={{ redirect: undefined }}
                className="mt-2 cursor-pointer rounded-lg bg-brand px-3 py-3 text-center text-base font-semibold text-white hover:bg-brand-dark"
                onClick={() => setOpen(false)}
              >
                {ctaLabel}
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      <main id="contenido-principal">{children}</main>

      <footer className="bg-ink text-neutral-300" role="contentinfo">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-2">
            <p className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white">
              <img
                src="/favicon.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-md object-contain"
              />
              Matu<span className="text-brand">SMS</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-400">
              Pasarela SMS profesional del ecosistema MatuDB. Convierte tu Android en gateway con API
              REST, webhooks HMAC y panel en español.
            </p>
            <p className="mt-4 space-y-1.5 text-sm">
              <a
                href="mailto:contacto@matubyte.com"
                className="block font-medium text-white underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                contacto@matubyte.com
              </a>
              <a
                href="https://wa.me/573332771764"
                target="_blank"
                rel="noopener noreferrer"
                className="block font-medium text-white underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                WhatsApp +57 333 277 1764
              </a>
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Producto</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="/#plataforma" className="hover:text-white">
                  Plataforma
                </a>
              </li>
              <li>
                <a href="/#bloques" className="hover:text-white">
                  Soluciones
                </a>
              </li>
              <li>
                <a href="/#developers" className="hover:text-white">
                  API para developers
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-white">
                  Preguntas frecuentes
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Cuenta</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/register" search={{ redirect: undefined }} className="hover:text-white">
                  Crear cuenta gratis
                </Link>
              </li>
              <li>
                <Link to="/login" search={{ redirect: undefined }} className="hover:text-white">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <a href="mailto:contacto@matubyte.com" className="hover:text-white">
                  Email
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/573332771764"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Legal</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/legal" className="hover:text-white">
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link to="/legal" className="hover:text-white">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to="/legal" className="hover:text-white">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-6 text-center sm:px-6 lg:px-8">
            <p className="text-sm text-neutral-300">
              Hecho con{' '}
              <span className="text-brand" aria-hidden>
                ♥
              </span>{' '}
              por <span className="font-semibold text-white">MatuByte S.A.S.</span>
            </p>
            <p className="mt-1.5 text-xs text-neutral-500">
              MatuByte S.A.S. · Sitio web oficial:{' '}
              <a
                href="https://matubyte.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 underline-offset-2 hover:text-white hover:underline"
              >
                https://matubyte.com
              </a>
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              © {new Date().getFullYear()} MatuSMS · MatuByte S.A.S. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
