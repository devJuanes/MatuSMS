import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { MessageSquare, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { formatTime, initials } from '@/lib/countries';
import type { Message, MessageThread } from '@matusms/shared';

export function SearchPage() {
  const { getToken } = useAuth();
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', submitted],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{
        data: { messages: Message[]; threads: MessageThread[] };
      }>(`/v1/messages/search?q=${encodeURIComponent(submitted)}`, { token: token! });
      return res.data;
    },
    enabled: submitted.length >= 2,
  });

  const searching = isLoading || isFetching;
  const tooShort = q.trim().length > 0 && q.trim().length < 2;
  const hasResults = !!data && (data.threads.length > 0 || data.messages.length > 0);
  const emptyResults = !!submitted && !!data && !hasResults;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Buscar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Encuentra conversaciones y mensajes por número o contenido.
          </p>
        </header>

        <form
          className="mb-8"
          onSubmit={(e) => {
            e.preventDefault();
            const next = q.trim();
            if (next.length < 2) return;
            setSubmitted(next);
          }}
        >
          <label htmlFor="search-q" className="sr-only">
            Buscar mensajes y contactos
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="search-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar mensajes y contactos…"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <button
              type="submit"
              disabled={q.trim().length < 2 || searching}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {searching ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
          {tooShort ? (
            <p className="mt-2 text-xs text-slate-500">Escribe al menos 2 caracteres.</p>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              Ejemplo: un número, un nombre o una palabra del mensaje.
            </p>
          )}
        </form>

        {!submitted && !searching ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <Search className="mx-auto h-10 w-10 text-brand/40" aria-hidden />
            <p className="mt-4 font-medium text-slate-700">Busca en tu historial</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Escribe un contacto o un fragmento de mensaje y pulsa Buscar.
            </p>
          </div>
        ) : null}

        {searching ? <CardListSkeleton rows={4} /> : null}

        {submitted && data && !searching ? (
          <div className="space-y-8">
            <section aria-labelledby="search-threads-heading">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-brand" aria-hidden />
                <h2 id="search-threads-heading" className="text-lg font-semibold text-slate-900">
                  Conversaciones
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {data.threads.length}
                </span>
              </div>
              <div className="space-y-2">
                {data.threads.map((t) => (
                  <Link
                    key={t.id}
                    to="/mensajes"
                    search={{ owner: t.owner, contact: t.contact, nuevo: undefined }}
                    className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand/30 hover:bg-brand-light/40"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                      {initials(t.contact)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-slate-900">{t.contact}</p>
                        <span className="shrink-0 text-xs text-slate-400">
                          {formatTime(t.order_timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {t.last_message_content || 'Sin mensajes'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">vía {t.owner}</p>
                    </div>
                  </Link>
                ))}
                {!data.threads.length ? (
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No se encontraron conversaciones.
                  </p>
                ) : null}
              </div>
            </section>

            <section aria-labelledby="search-messages-heading">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-brand" aria-hidden />
                <h2 id="search-messages-heading" className="text-lg font-semibold text-slate-900">
                  Mensajes
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {data.messages.length}
                </span>
              </div>
              <div className="space-y-2">
                {data.messages.map((m) => (
                  <Link
                    key={m.id}
                    to="/mensajes"
                    search={{
                      owner: m.owner,
                      contact: m.contact,
                      nuevo: undefined,
                    }}
                    className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand/30 hover:bg-brand-light/40"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{m.contact}</span>
                      <span aria-hidden>·</span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 capitalize">
                        {m.status}
                      </span>
                      {m.order_timestamp ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>{formatTime(m.order_timestamp)}</span>
                        </>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-800">{m.content}</p>
                  </Link>
                ))}
                {!data.messages.length ? (
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No se encontraron mensajes.
                  </p>
                ) : null}
              </div>
            </section>

            {emptyResults ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
                <p className="font-medium text-slate-700">Sin resultados para “{submitted}”</p>
                <p className="mt-1 text-sm text-slate-500">Prueba con otro número o palabra clave.</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
