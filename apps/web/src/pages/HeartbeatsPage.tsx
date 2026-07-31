import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { Phone } from '@matusms/shared';

type HeartbeatMonitor = {
  id: string;
  phone_id: string;
  user_id: string;
  last_seen_at: string | null;
  status: string;
  updated_at: string;
};

export function HeartbeatsPage() {
  const { getToken } = useAuth();

  const { data: phones } = useQuery({
    queryKey: ['phones'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: Phone[] }>('/v1/phones', { token: token! });
      return res.data;
    },
  });

  const { data: monitors, isLoading } = useQuery({
    queryKey: ['heartbeat-monitors'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: HeartbeatMonitor[] }>('/v1/heartbeats/monitors', {
        token: token!,
      });
      return res.data;
    },
    refetchInterval: 30_000,
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Heartbeats</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Phone gateway status. Offline if no heartbeat in 5 minutes.
      </p>

      {isLoading && <p className="text-zinc-400">Loading…</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {monitors?.map((m) => {
          const phone = phones?.find((p) => p.id === m.phone_id);
          const online = m.status === 'online';
          return (
            <div key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${online ? 'bg-green-500' : 'bg-orange-500'}`}
                />
                <p className="font-medium">{phone?.phone_number ?? m.phone_id}</p>
              </div>
              <p className="mt-2 text-sm capitalize text-zinc-400">{m.status}</p>
              <p className="text-xs text-zinc-500">
                Last seen: {m.last_seen_at ? new Date(m.last_seen_at).toLocaleString() : '—'}
              </p>
            </div>
          );
        })}
        {!isLoading && !monitors?.length && (
          <p className="text-zinc-500">No heartbeats yet — link the MatuSMS app on your phone.</p>
        )}
      </div>
    </div>
  );
}
