import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { BulkMessage, Phone } from '@matusms/shared';

export function BulkPage() {
  const { getToken } = useAuth();
  const [csv, setCsv] = useState('to,content\n+18005550199,Hello from MatuSMS');
  const [phoneId, setPhoneId] = useState('');
  const qc = useQueryClient();

  const { data: phones } = useQuery({
    queryKey: ['phones'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: Phone[] }>('/v1/phones', { token: token! });
      return res.data;
    },
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['bulk-jobs'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: BulkMessage[] }>('/v1/bulk-messages', { token: token! });
      return res.data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const lines = csv.trim().split('\n').slice(1);
      const messages = lines.map((line) => {
        const [to, ...rest] = line.split(',');
        return { to: to.trim(), content: rest.join(',').trim() };
      });
      const token = await getToken();
      return apiFetch('/v1/messages/bulk-send', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({
          phone_id: phoneId || undefined,
          filename: 'upload.csv',
          messages,
        }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bulk-jobs'] }),
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Envío masivo</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Sube un CSV con columnas <code className="text-brand">to,content</code>. Límite: 3 por minuto.
      </p>

      <div className="mb-4">
        <select
          value={phoneId}
          onChange={(e) => setPhoneId(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm"
        >
          <option value="">Teléfono por defecto</option>
          {phones?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sim} — {p.phone_number}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={8}
        className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 font-mono text-sm"
      />

      <button
        onClick={() => sendMutation.mutate()}
        disabled={sendMutation.isPending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {sendMutation.isPending ? 'Enviando…' : 'Enviar lote'}
      </button>

      <h2 className="mb-3 mt-10 text-lg font-semibold">Trabajos recientes</h2>
      {isLoading && <p className="text-zinc-400">Cargando…</p>}
      <div className="space-y-2">
        {jobs?.map((j) => (
          <div key={j.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm">
            <span className="font-medium">{j.status}</span> — {j.success_count}/{j.total_count} enviados
            {j.failed_count > 0 && (
              <span className="text-red-400"> ({j.failed_count} con error)</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
