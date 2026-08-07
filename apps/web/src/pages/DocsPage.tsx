import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Shield,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, API_BASE } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import type { User } from '@matusms/shared';

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
      {label && (
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2 text-xs text-slate-400">
          <span>{label}</span>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1 text-slate-300 hover:text-white"
          >
            <Copy size={14} />
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
      {!label && (
        <div className="flex justify-end border-b border-slate-700 px-4 py-2">
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white"
          >
            <Copy size={14} />
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const PURPOSES = [
  { id: 'login', label: 'Inicio de sesión', desc: 'Confirmar login con código SMS' },
  { id: 'register', label: 'Registro', desc: 'Verificar teléfono al crear cuenta' },
  { id: 'password_reset', label: 'Olvido de contraseña', desc: 'Código para restablecer contraseña' },
  { id: 'transaction', label: 'Transaccional', desc: 'Pagos, cambios de datos, etc.' },
  { id: 'custom', label: 'Personalizado', desc: 'Plantilla propia con {{codigo}}' },
];

export function DocsPage() {
  const { getToken } = useAuth();
  const apiBase = API_BASE.replace(/\/$/, '');

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: User }>('/v1/users/me', { token: token! });
      return res.data;
    },
  });

  const maskedKey = user?.api_key
    ? `${user.api_key.slice(0, 8)}…${user.api_key.slice(-4)}`
    : 'TU_API_KEY';

  const nodeSendSms = `const res = await fetch('${apiBase}/v1/messages/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.MATUSMS_API_KEY,
  },
  body: JSON.stringify({
    to: '+573001234567',
    content: 'Tu pedido #{{numero}} fue confirmado.',
    variables: { numero: '1042' },
  }),
});
const { data } = await res.json();
console.log(data);`;

  const nodeOtpLogin = `// Paso 1: enviar código al usuario tras validar credenciales
await fetch('${apiBase}/v1/verifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.MATUSMS_API_KEY,
  },
  body: JSON.stringify({
    to: '+573001234567',
    purpose: 'login',
    locale: 'es',
  }),
});

// Paso 2: usuario ingresa código en tu app → verificar
const verifyRes = await fetch('${apiBase}/v1/verifications/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.MATUSMS_API_KEY,
  },
  body: JSON.stringify({
    to: '+573001234567',
    purpose: 'login',
    code: '482910',
  }),
});
const { data } = await verifyRes.json();
if (data.verified) {
  // Crear sesión JWT / cookie en tu backend
}`;

  const nodeOtpRegister = `await fetch('${apiBase}/v1/verifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.MATUSMS_API_KEY,
  },
  body: JSON.stringify({
    to: '+573001234567',
    purpose: 'register',
    locale: 'es',
  }),
});`;

  const nodeOtpReset = `await fetch('${apiBase}/v1/verifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.MATUSMS_API_KEY,
  },
  body: JSON.stringify({
    to: '+573001234567',
    purpose: 'password_reset',
    locale: 'es',
  }),
});`;

  const curlOtp = `curl -X POST ${apiBase}/v1/verifications \\
  -H "x-api-key: ${maskedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"to":"+573001234567","purpose":"login","locale":"es"}'`;

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-brand">
              <BookOpen size={22} />
              <span className="text-sm font-medium">Integración SaaS</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">Documentación API</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Envía SMS transaccionales y códigos OTP (login, registro, recuperación de contraseña)
              desde tu backend con la API REST de MatuSMS.
            </p>
          </div>
          <a
            href={`${apiBase}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            OpenAPI interactivo
            <ExternalLink size={16} />
          </a>
        </div>

        {/* Requisitos */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 size={20} className="text-brand" />
            Qué necesitas para empezar
          </h2>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <KeyRound size={18} className="mt-0.5 shrink-0 text-brand" />
              <span>
                <strong className="text-slate-800">API Key de usuario</strong> — autentica tus
                llamadas desde el backend. No la expongas en apps mobile/web públicas.
              </span>
            </li>
            <li className="flex gap-3">
              <Smartphone size={18} className="mt-0.5 shrink-0 text-brand" />
              <span>
                <strong className="text-slate-800">Teléfono Android vinculado</strong> — app MatuSMS
                instalada, con permisos SMS y gateway activo (
                <Link to="/phones" className="text-brand hover:underline">Teléfonos</Link>
                {' · '}
                <Link to="/heartbeats" className="text-brand hover:underline">Estado</Link>).
              </span>
            </li>
            <li className="flex gap-3">
              <Shield size={18} className="mt-0.5 shrink-0 text-brand" />
              <span>
                <strong className="text-slate-800">Números E.164</strong> — formato internacional,
                ej. <code className="rounded bg-slate-100 px-1">+573001234567</code>.
              </span>
            </li>
          </ul>
        </section>

        {/* API Key */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Tu API Key</h2>
          <p className="mb-4 text-sm text-slate-500">
            Usa el header <code className="rounded bg-slate-100 px-1">x-api-key</code> en todas las
            peticiones desde tu servidor.
          </p>
          {user ? (
            <div className="rounded-xl bg-slate-50 p-4 font-mono text-sm break-all">{user.api_key}</div>
          ) : (
            <div role="status" aria-label="Cargando API key">
              <span className="sr-only">Cargando…</span>
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {user && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(user.api_key)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
              >
                <Copy size={16} /> Copiar API Key
              </button>
            )}
            <Link
              to="/settings"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Gestionar en Configuración
            </Link>
          </div>
        </section>

        {/* Auth */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Autenticación</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Cliente</th>
                  <th className="pb-3 pr-4 font-medium">Header</th>
                  <th className="pb-3 font-medium">Uso</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">Tu backend / SaaS</td>
                  <td className="py-3 pr-4 font-mono text-xs">x-api-key: {maskedKey}</td>
                  <td className="py-3">Enviar SMS, OTP, webhooks</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">Dashboard (este sitio)</td>
                  <td className="py-3 pr-4 font-mono text-xs">Authorization: Bearer JWT</td>
                  <td className="py-3">Firebase — no usar en integraciones</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium">App Android gateway</td>
                  <td className="py-3 pr-4 font-mono text-xs">x-api-key: phone_key</td>
                  <td className="py-3">Poll / claim mensajes (automático)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Base URL: <code className="rounded bg-slate-100 px-1">{apiBase}</code>
          </p>
        </section>

        {/* Flujo OTP */}
        <section className="mb-8 rounded-2xl border border-brand/20 bg-brand-light/30 p-6">
          <h2 className="mb-2 text-lg font-semibold">Flujo OTP recomendado</h2>
          <ol className="list-inside list-decimal space-y-2 text-sm text-slate-700">
            <li>Tu backend llama <code className="rounded bg-white px-1">POST /v1/verifications</code></li>
            <li>MatuSMS genera el código y envía el SMS por tu teléfono Android</li>
            <li>El usuario recibe el SMS e ingresa el código en tu app</li>
            <li>Tu backend llama <code className="rounded bg-white px-1">POST /v1/verifications/verify</code></li>
            <li>Si <code className="rounded bg-white px-1">verified: true</code>, completa login / registro / reset</li>
          </ol>
        </section>

        {/* Purposes */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Purposes (casos de uso)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PURPOSES.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-mono text-sm font-semibold text-brand">{p.id}</p>
                <p className="font-medium text-slate-800">{p.label}</p>
                <p className="text-sm text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ejemplos */}
        <section className="mb-8 space-y-8">
          <h2 className="text-lg font-semibold">Ejemplos de integración (Node.js)</h2>

          <div>
            <h3 className="mb-2 font-medium text-slate-800">Enviar SMS con plantilla</h3>
            <p className="mb-3 text-sm text-slate-500">
              <code className="rounded bg-slate-100 px-1">POST /v1/messages/send</code> — tú defines
              el texto y variables. MatuSMS no valida códigos.
            </p>
            <CodeBlock code={nodeSendSms} label="Node.js · fetch" />
          </div>

          <div>
            <h3 className="mb-2 font-medium text-slate-800">Login — confirmación por SMS</h3>
            <p className="mb-3 text-sm text-slate-500">
              <code className="rounded bg-slate-100 px-1">purpose: &quot;login&quot;</code>
            </p>
            <CodeBlock code={nodeOtpLogin} label="Node.js · login + verify" />
          </div>

          <div>
            <h3 className="mb-2 font-medium text-slate-800">Registro — verificar teléfono</h3>
            <CodeBlock code={nodeOtpRegister} label="Node.js · register" />
          </div>

          <div>
            <h3 className="mb-2 font-medium text-slate-800">Olvido de contraseña</h3>
            <CodeBlock code={nodeOtpReset} label="Node.js · password_reset" />
          </div>

          <div>
            <h3 className="mb-2 font-medium text-slate-800">curl rápido</h3>
            <CodeBlock code={curlOtp} label="Terminal" />
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Endpoints principales</h2>
          <div className="space-y-2 text-sm">
            {[
              ['POST', '/v1/verifications', 'Crear y enviar código OTP'],
              ['POST', '/v1/verifications/verify', 'Validar código ingresado'],
              ['GET', '/v1/verifications/:id', 'Estado de verificación'],
              ['POST', '/v1/messages/send', 'SMS libre o con {{variables}}'],
              ['GET', '/v1/users/me', 'Perfil y API key'],
            ].map(([method, path, desc]) => (
              <div
                key={path}
                className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
              >
                <span
                  className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                    method === 'POST' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {method}
                </span>
                <code className="font-mono text-slate-800">{path}</code>
                <span className="text-slate-500">— {desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Webhooks + límites */}
        <section className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Webhooks</h2>
            <p className="mb-3 text-sm text-slate-500">
              Configura en{' '}
              <Link to="/webhooks" className="text-brand hover:underline">Webhooks</Link>.
            </p>
            <ul className="space-y-1 text-sm text-slate-600">
              <li><code className="text-xs">verification.sent</code></li>
              <li><code className="text-xs">verification.verified</code></li>
              <li><code className="text-xs">verification.failed</code></li>
              <li><code className="text-xs">message.phone.sent</code></li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Límites OTP</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Código: 6 dígitos (configurable 4–8)</li>
              <li>Expira en 10 minutos (configurable)</li>
              <li>Máx. 5 intentos de verificación</li>
              <li>Máx. 3 envíos al mismo número / 15 min</li>
            </ul>
          </div>
        </section>

        <p className="text-center text-sm text-slate-500">
          ¿Dudas?{' '}
          <a href="mailto:contacto@matubyte.com" className="text-brand hover:underline">
            contacto@matubyte.com
          </a>
        </p>
      </div>
    </div>
  );
}
