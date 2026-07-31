import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Copy, KeyRound, QrCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { User } from '@matusms/shared';

const E2E_STORAGE_KEY = 'matusms_e2e_key';

function generateE2eKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function SettingsPage() {
  const { getToken } = useAuth();
  const [e2eKey, setE2eKey] = useState(() => localStorage.getItem(E2E_STORAGE_KEY) ?? '');
  const [encryptByDefault, setEncryptByDefault] = useState(
    () => localStorage.getItem('matusms_encrypt_default') === 'true',
  );
  const [showQr, setShowQr] = useState(false);
  const [linkQr, setLinkQr] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: User }>('/v1/users/me', { token: token! });
      return res.data;
    },
  });

  const rotateMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch('/v1/users/me/api-key/rotate', { method: 'POST', token: token! });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      setLinkQr(null);
    },
  });

  async function loadLinkQr() {
    const token = await getToken();
    const res = await apiFetch<{ data: { payload: string } }>('/v1/users/me/link-qr', {
      token: token!,
    });
    setLinkQr(res.data.payload);
    setShowQr(true);
  }

  function handleGenerateE2e() {
    const key = generateE2eKey();
    localStorage.setItem(E2E_STORAGE_KEY, key);
    setE2eKey(key);
  }

  const e2eQrPayload = e2eKey ? JSON.stringify({ type: 'e2e_key', key: e2eKey }) : '';

  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Configuración</h1>
      {isLoading && <p className="text-slate-500">Cargando…</p>}
      {user && (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <KeyRound size={20} className="text-brand" />
              API Key para la app Android
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Usa esta clave en la app MatuSMS para vincular tu teléfono. Para integraciones SaaS
              desde tu backend usa el mismo key con{' '}
              <code className="rounded bg-slate-100 px-1">x-api-key</code>.{' '}
              <Link to="/documentacion" className="text-brand hover:underline">
                Ver documentación API
              </Link>
            </p>
            <div className="rounded-xl bg-slate-50 p-4 font-mono text-sm break-all">{user.api_key}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(user.api_key)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
              >
                <Copy size={16} /> Copiar
              </button>
              <button
                type="button"
                onClick={loadLinkQr}
                className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                <QrCode size={16} /> Mostrar QR
              </button>
              <button
                type="button"
                onClick={() => rotateMutation.mutate()}
                className="text-sm text-red-500 hover:underline"
              >
                Rotar API Key
              </button>
            </div>
            {showQr && linkQr && (
              <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-6">
                <QRCodeSVG value={linkQr} size={200} />
                <p className="text-center text-xs text-slate-500">
                  Escanea con la app MatuSMS → Iniciar sesión
                </p>
                <button type="button" onClick={() => setShowQr(false)} className="text-sm text-brand">
                  Cerrar
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-2">
              <label className="text-xs text-slate-500">Correo</label>
              <p>{user.email}</p>
            </div>
            <div className="mb-2">
              <label className="text-xs text-slate-500">Zona horaria</label>
              <p>{user.timezone}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500">Plan</label>
              <p>{user.subscription_name}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-semibold">Cifrado de extremo a extremo (opcional)</h2>
            <p className="mb-4 text-sm text-slate-500">
              Clave AES almacenada en tu navegador. Escanea el QR con la app para sincronizar.
            </p>
            {e2eKey ? (
              <div className="flex flex-col items-center gap-4">
                {e2eQrPayload && <QRCodeSVG value={e2eQrPayload} size={160} />}
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(E2E_STORAGE_KEY);
                    setE2eKey('');
                  }}
                  className="text-sm text-red-500 hover:underline"
                >
                  Eliminar clave E2E
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerateE2e}
                className="rounded-xl bg-brand px-4 py-2 text-sm text-white"
              >
                Generar clave E2E
              </button>
            )}
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={encryptByDefault}
                onChange={(e) => {
                  setEncryptByDefault(e.target.checked);
                  localStorage.setItem('matusms_encrypt_default', String(e.target.checked));
                }}
              />
              Cifrar SMS salientes por defecto
            </label>
          </div>

          <p className="text-sm text-slate-500">
            <Link to="/legal" className="text-brand hover:underline">
              Términos y privacidad
            </Link>
            {' · '}
            <a href="mailto:support@matusms.com" className="text-brand">
              support@matusms.com
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
