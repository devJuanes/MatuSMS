import { useQuery } from '@tanstack/react-query';
import { Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import type { Phone } from '@matusms/shared';

export function PhonesPage() {
  const { user, getToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['phones'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: Phone[] }>('/v1/phones', { token: token! });
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Teléfonos vinculados</h1>
      <p className="mb-6 text-slate-500">
        Los teléfonos se registran desde la app Android con tu API Key. Aquí ves el estado de cada SIM.
        Si aparece <strong>Sin FCM</strong>, configura Firebase en la app Android (ver{' '}
        <code className="rounded bg-slate-100 px-1">docs/firebase-android.md</code>) para envío instantáneo
        desde el dashboard.
      </p>

      {isLoading && <CardListSkeleton rows={3} />}

      {!isLoading && !data?.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Smartphone className="mx-auto mb-4 text-brand" size={48} />
          <p className="font-medium text-slate-700">Ningún teléfono vinculado</p>
          <p className="mt-2 text-sm text-slate-500">
            Abre la app MatuSMS en Android, ingresa tu API Key y los números de tus SIM.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((phone) => (
          <div
            key={phone.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand">
                {phone.sim}
              </span>
              {phone.fcm_token ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Wifi size={14} /> Conectado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <WifiOff size={14} /> Sin FCM
                </span>
              )}
            </div>
            <p className="text-lg font-semibold text-slate-900">{phone.phone_number}</p>
            <p className="mt-2 text-sm text-slate-500">
              {phone.messages_per_minute} msg/min · expira en {phone.message_expiration_seconds}s
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
