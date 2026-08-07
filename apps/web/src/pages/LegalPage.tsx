import { Link } from '@tanstack/react-router';
import { PublicShell } from '@/components/marketing/PublicShell';

export function LegalPage() {
  return (
    <PublicShell ctaHref="/register" ctaLabel="Comenzar">
      <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
        <nav aria-label="Migas de pan" className="text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="font-medium text-brand hover:underline">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink">Legal</li>
          </ol>
        </nav>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          MatuSMS — Legal
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          Términos de servicio, política de privacidad y cookies.
        </p>

        <div className="mt-12 space-y-12 border-t border-neutral-200 pt-12">
          <section id="terminos" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-bold text-ink">Términos de servicio</h2>
            <p className="text-sm leading-relaxed text-neutral-600">
              MatuSMS es una plataforma de pasarela SMS del ecosistema MatuDB. Al usar MatuSMS
              aceptas cumplir las leyes de telecomunicaciones aplicables y obtener consentimiento
              antes de enviar mensajes SMS.
            </p>
            <p className="text-sm leading-relaxed text-neutral-600">
              Eres responsable de todos los mensajes enviados a través de tus teléfonos y API keys
              registrados. MatuSMS se proporciona &quot;tal cual&quot; sin garantía.
            </p>
          </section>

          <section id="privacidad" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-bold text-ink">Política de privacidad</h2>
            <p className="text-sm leading-relaxed text-neutral-600">
              El contenido de mensajes, números de teléfono y datos de cuenta se almacenan en tu
              proyecto MatuDB. No vendemos tus datos. Firebase Authentication se usa para el login
              del panel; FCM notifica a la app Android de mensajes pendientes.
            </p>
            <p className="text-sm leading-relaxed text-neutral-600">
              Las claves de cifrado opcional se guardan solo en tus dispositivos y nunca se envían
              a nuestros servidores.
            </p>
          </section>

          <section id="cookies" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-bold text-ink">Cookies</h2>
            <p className="text-sm leading-relaxed text-neutral-600">
              Usamos cookies y almacenamiento local estrictamente necesarios para autenticación de
              sesión, preferencias de seguridad (p. ej. Turnstile) y funcionamiento del panel. No
              usamos cookies publicitarias de terceros.
            </p>
          </section>

          <section id="contacto" className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-bold text-ink">Contacto</h2>
            <p className="text-sm text-neutral-600">
              Email:{' '}
              <a href="mailto:contacto@matubyte.com" className="font-medium text-brand hover:underline">
                contacto@matubyte.com
              </a>
            </p>
            <p className="text-sm text-neutral-600">
              WhatsApp:{' '}
              <a
                href="https://wa.me/573332771764"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand hover:underline"
              >
                +57 333 277 1764
              </a>
            </p>
          </section>
        </div>
      </article>
    </PublicShell>
  );
}
