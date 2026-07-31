import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { Webhook } from '@matusms/shared';
import { webhookEventTypes } from '@matusms/shared';

export function WebhooksPage() {
  const { getToken } = useAuth();
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['message.phone.received']);
  const qc = useQueryClient();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: Webhook[] }>('/v1/webhooks', { token: token! });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch('/v1/webhooks', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ url, events }),
      });
    },
    onSuccess: () => {
      setUrl('');
      qc.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/v1/webhooks/${id}`, { method: 'DELETE', token: token! });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Webhooks</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Receive HTTP callbacks with HMAC-signed payloads when SMS events occur.
      </p>

      <form
        className="mb-8 space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-server.com/webhook"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm"
          required
        />
        <div className="flex flex-wrap gap-2">
          {webhookEventTypes.map((ev) => (
            <label key={ev} className="flex items-center gap-1 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={events.includes(ev)}
                onChange={(e) =>
                  setEvents((prev) =>
                    e.target.checked ? [...prev, ev] : prev.filter((x) => x !== ev),
                  )
                }
              />
              {ev}
            </label>
          ))}
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Add webhook
        </button>
      </form>

      {isLoading && <p className="text-zinc-400">Loading…</p>}
      <div className="space-y-3">
        {webhooks?.map((w) => (
          <div key={w.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="font-mono text-sm break-all">{w.url}</p>
            <p className="mt-1 text-xs text-zinc-500">Events: {w.events.join(', ') || 'all'}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Signing key: {w.signing_key.slice(0, 16)}…
            </p>
            <button
              onClick={() => deleteMutation.mutate(w.id)}
              className="mt-3 text-sm text-red-400 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
