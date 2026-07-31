import { Link } from '@tanstack/react-router';
import { PublicShell } from '@/components/marketing/PublicShell';

export function LegalPage() {
  return (
    <PublicShell ctaHref="/register" ctaLabel="Crear cuenta">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Link to="/" className="text-sm font-medium text-brand hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="mb-8 mt-6 text-3xl font-bold text-slate-900">MatuSMS — Legal</h1>

        <div className="space-y-8 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Términos de servicio</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              MatuSMS es una plataforma de pasarela SMS del ecosistema MatuDB. Al usar MatuSMS
              aceptas cumplir las leyes de telecomunicaciones aplicables y obtener consentimiento
              antes de enviar mensajes SMS.
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              Eres responsable de todos los mensajes enviados a través de tus teléfonos y API keys
              registrados. MatuSMS se proporciona &quot;tal cual&quot; sin garantía.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Política de privacidad</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              El contenido de mensajes, números de teléfono y datos de cuenta se almacenan en tu
              proyecto MatuDB. No vendemos tus datos. Firebase Authentication se usa para el login
              del panel; FCM notifica a la app Android de mensajes pendientes.
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              Las claves de cifrado opcional se guardan solo en tus dispositivos y nunca se envían
              a nuestros servidores.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Contacto</h2>
            <p className="text-sm text-slate-600">
              Soporte:{' '}
              <a href="mailto:support@matusms.com" className="text-brand hover:underline">
                support@matusms.com
              </a>
            </p>
            <p className="text-sm text-slate-600">
              Sistema:{' '}
              <a href="mailto:system@matusms.com" className="text-brand hover:underline">
                system@matusms.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
