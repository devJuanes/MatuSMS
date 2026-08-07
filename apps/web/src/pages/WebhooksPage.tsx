import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Link2, Trash2, Webhook as WebhookIcon } from 'lucide-react';
import { useState } from 'react';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { Webhook } from '@matusms/shared';
import { webhookEventTypes } from '@matusms/shared';

const EVENT_LABELS: Record<(typeof webhookEventTypes)[number], string> = {
  'message.phone.sent': 'Mensaje enviado',
  'message.phone.delivered': 'Mensaje entregado',
  'message.phone.failed': 'Mensaje fallido',
  'message.phone.received': 'Mensaje recibido',
  'message.send.expired': 'Envío expirado',
  'verification.sent': 'Verificación enviada',
  'verification.verified': 'Verificación OK',
  'verification.failed': 'Verificación fallida',
  'verification.expired': 'Verificación expirada',
  'phone.heartbeat.offline': 'Teléfono offline',
  'phone.heartbeat.online': 'Teléfono online',
  'phone.updated': 'Teléfono actualizado',
};

const EVENT_GROUPS = [
  {
    title: 'Mensajes',
    events: [
      'message.phone.sent',
      'message.phone.delivered',
      'message.phone.failed',
      'message.phone.received',
      'message.send.expired',
    ] as const,
  },
  {
    title: 'Verificación',
    events: [
      'verification.sent',
      'verification.verified',
      'verification.failed',
      'verification.expired',
    ] as const,
  },
  {
    title: 'Teléfonos',
    events: ['phone.heartbeat.offline', 'phone.heartbeat.online', 'phone.updated'] as const,
  },
] as const;

export function WebhooksPage() {
  const { getToken } = useAuth();
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['message.phone.received']);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  function toggleEvent(ev: string, checked: boolean) {
    setEvents((prev) => (checked ? [...prev, ev] : prev.filter((x) => x !== ev)));
  }

  function selectGroup(groupEvents: readonly string[], allSelected: boolean) {
    setEvents((prev) => {
      if (allSelected) return prev.filter((e) => !groupEvents.includes(e));
      const next = new Set([...prev, ...groupEvents]);
      return [...next];
    });
  }

  async function copySigningKey(id: string, key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Webhooks</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Recibe callbacks HTTP firmados con HMAC cuando ocurren eventos de SMS, verificación o
            estado del teléfono.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-brand" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900">Agregar webhook</h2>
          </div>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <div>
              <label htmlFor="webhook-url" className="mb-1.5 block text-sm font-medium text-slate-700">
                URL del endpoint
              </label>
              <input
                id="webhook-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://tu-servidor.com/webhook"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                required
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-slate-700">Eventos</p>
              <div className="space-y-4">
                {EVENT_GROUPS.map((group) => {
                  const allSelected = group.events.every((ev) => events.includes(ev));
                  return (
                    <div
                      key={group.title}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-800">{group.title}</h3>
                        <button
                          type="button"
                          onClick={() => selectGroup(group.events, allSelected)}
                          className="cursor-pointer text-xs font-medium text-brand hover:underline"
                        >
                          {allSelected ? 'Quitar grupo' : 'Seleccionar grupo'}
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.events.map((ev) => (
                          <label
                            key={ev}
                            className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200 transition hover:ring-slate-300"
                          >
                            <input
                              type="checkbox"
                              checked={events.includes(ev)}
                              onChange={(e) => toggleEvent(ev, e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
                            />
                            <span>
                              <span className="block font-medium">{EVENT_LABELS[ev]}</span>
                              <span className="mt-0.5 block font-mono text-[11px] text-slate-400">
                                {ev}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">
                {events.length} evento{events.length === 1 ? '' : 's'} seleccionado
                {events.length === 1 ? '' : 's'}
              </p>
              <button
                type="submit"
                disabled={createMutation.isPending || !url.trim() || events.length === 0}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createMutation.isPending ? 'Agregando…' : 'Agregar webhook'}
              </button>
            </div>

            {createMutation.isError ? (
              <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                {(createMutation.error as Error).message || 'No se pudo crear el webhook'}
              </p>
            ) : null}
          </form>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Tus webhooks</h2>

          {isLoading ? <CardListSkeleton rows={2} /> : null}

          {!isLoading && !webhooks?.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
              <WebhookIcon className="mx-auto h-10 w-10 text-brand/40" aria-hidden />
              <p className="mt-4 font-medium text-slate-700">Sin webhooks todavía</p>
              <p className="mt-1 text-sm text-slate-500">
                Agrega una URL para recibir notificaciones en tiempo real.
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            {webhooks?.map((w) => (
              <article
                key={w.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="break-all font-mono text-sm font-medium text-slate-900">{w.url}</p>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(w.id)}
                    disabled={deleteMutation.isPending}
                    className="inline-flex shrink-0 min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    aria-label="Eliminar webhook"
                  >
                    <Trash2 size={15} />
                    Eliminar
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(w.events.length ? w.events : ['todos']).map((ev) => (
                    <span
                      key={ev}
                      className="inline-flex rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200"
                    >
                      {ev === 'todos'
                        ? 'Todos los eventos'
                        : (EVENT_LABELS[ev as keyof typeof EVENT_LABELS] ?? ev)}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="text-xs font-medium text-slate-500">Clave de firma</span>
                  <code className="font-mono text-xs text-slate-700">
                    {w.signing_key.slice(0, 20)}…
                  </code>
                  <button
                    type="button"
                    onClick={() => copySigningKey(w.id, w.signing_key)}
                    className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand transition hover:bg-white"
                  >
                    {copiedId === w.id ? (
                      <>
                        <Check size={13} />
                        Copiada
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
