import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Plus, Search, Send, X } from 'lucide-react';
import { MessageStatusIcon } from '@/components/MessageStatusIcon';
import { PhoneInput, toE164 } from '@/components/PhoneInput';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { defaultCountry, formatTime, initials, type Country } from '@/lib/countries';
import { encryptContent, getE2eKey, shouldEncryptByDefault } from '@/lib/e2e';
import type { Message, MessageThread, Phone } from '@matusms/shared';

export function MessagingPage() {
  const { user, getToken } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { owner?: string; contact?: string; nuevo?: string };
  const [filter, setFilter] = useState('');
  const [composer, setComposer] = useState('');
  const [showNew, setShowNew] = useState(search.nuevo === '1');
  const [newNumber, setNewNumber] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [fromPhone, setFromPhone] = useState('');
  const [replyFrom, setReplyFrom] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const owner = search.owner;
  const contact = search.contact;

  const { data: threads, isLoading: loadingThreads } = useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: MessageThread[] }>('/v1/threads', { token: token! });
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: phones } = useQuery({
    queryKey: ['phones'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: Phone[] }>('/v1/phones', { token: token! });
      return res.data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (phones?.length && !fromPhone) setFromPhone(phones[0].phone_number);
  }, [phones, fromPhone]);

  useEffect(() => {
    if (owner) setReplyFrom(owner);
  }, [owner]);

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['thread', owner, contact],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: Message[] }>(
        `/v1/threads/${encodeURIComponent(owner!)}/${encodeURIComponent(contact!)}/messages`,
        { token: token! },
      );
      return res.data;
    },
    enabled: !!owner && !!contact && !!user,
    refetchInterval: 10000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (payload: { to: string; content: string; from: string }) => {
      const token = await getToken();
      const key = getE2eKey();
      const useEncryption = shouldEncryptByDefault() && !!key;
      const body =
        useEncryption && key
          ? { ...payload, content: encryptContent(payload.content, key), encrypted: true }
          : payload;
      return apiFetch('/v1/messages/send', {
        method: 'POST',
        token: token!,
        body: JSON.stringify(body),
      });
    },
    onSuccess: (_data, variables) => {
      setComposer('');
      if (variables.from !== owner) {
        navigate({
          to: '/mensajes',
          search: { owner: variables.from, contact: variables.to, nuevo: undefined },
        });
      }
      qc.invalidateQueries({ queryKey: ['thread', owner, contact] });
      qc.invalidateQueries({ queryKey: ['thread', variables.from, variables.to] });
      qc.invalidateQueries({ queryKey: ['threads'] });
    },
  });

  const newMessageMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const to = toE164(country, newNumber);
      const from = fromPhone || phones?.[0]?.phone_number;
      if (!from) throw new Error('No hay teléfonos vinculados');
      const key = getE2eKey();
      const useEncryption = shouldEncryptByDefault() && !!key;
      const body =
        useEncryption && key
          ? { to, content: encryptContent(newMessage, key), from, encrypted: true }
          : { to, content: newMessage, from };
      return apiFetch('/v1/messages/send', {
        method: 'POST',
        token: token!,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      const to = toE164(country, newNumber);
      const from = fromPhone || phones?.[0]?.phone_number || '';
      setShowNew(false);
      setNewNumber('');
      setNewMessage('');
      navigate({
        to: '/mensajes',
        search: { owner: from, contact: to, nuevo: undefined },
      });
      qc.invalidateQueries({ queryKey: ['threads'] });
    },
  });

  const filtered = threads?.filter(
    (t) =>
      t.contact.includes(filter) ||
      (t.last_message_content ?? '').toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="flex h-screen">
      {/* Lista de conversaciones */}
      <section className="flex w-full max-w-md flex-col border-r border-slate-200 bg-white">
        <header className="border-b border-slate-100 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-brand">Mensajes</h1>
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="rounded-full bg-brand p-2 text-white shadow-md hover:bg-brand-dark"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar conversación…"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loadingThreads && <p className="p-6 text-slate-500">Cargando…</p>}
          {!loadingThreads && !filtered?.length && (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-slate-500">
              <MessageCircle size={48} className="text-brand/40" />
              <p>Sin conversaciones aún.</p>
              <p className="text-sm">Vincula tu Android o envía un SMS nuevo.</p>
            </div>
          )}
          {filtered?.map((thread) => {
            const active = owner === thread.owner && contact === thread.contact;
            return (
              <Link
                key={thread.id}
                to="/mensajes"
                search={{ owner: thread.owner, contact: thread.contact, nuevo: undefined }}
                className={`flex gap-3 border-b border-slate-50 px-5 py-4 transition hover:bg-slate-50 ${
                  active ? 'bg-brand-light/60' : ''
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {initials(thread.contact)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-slate-900">{thread.contact}</p>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatTime(thread.order_timestamp)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-500">{thread.last_message_content}</p>
                  <p className="mt-0.5 text-xs text-slate-400">desde {thread.owner}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Panel de chat */}
      <section className="flex flex-1 flex-col bg-surface">
        {!owner || !contact ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-slate-500">
            <MessageCircle size={64} className="text-brand/30" />
            <p className="text-lg">Selecciona una conversación</p>
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Nuevo mensaje
            </button>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {initials(contact)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{contact}</p>
                {phones && phones.length > 1 ? (
                  <label className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>Enviar desde</span>
                    <select
                      value={replyFrom}
                      onChange={(e) => setReplyFrom(e.target.value)}
                      className="max-w-[200px] truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                    >
                      {phones.map((p) => (
                        <option key={p.id} value={p.phone_number}>
                          {p.sim} — {p.phone_number}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="text-xs text-slate-500">vía {owner}</p>
                )}
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-6">
              {loadingMessages && <p className="text-slate-500">Cargando mensajes…</p>}
              {messages?.map((m) => {
                const outbound = m.type === 'mobile-terminated';
                return (
                  <div key={m.id} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        outbound
                          ? 'rounded-br-md bg-brand text-white'
                          : 'rounded-bl-md border border-slate-100 bg-white text-slate-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${outbound ? 'text-blue-100' : 'text-slate-400'}`}>
                        <span>{formatTime(m.order_timestamp)}</span>
                        {outbound && <MessageStatusIcon status={m.status} outbound />}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form
              className="flex gap-2 border-t border-slate-200 bg-white p-4"
              onSubmit={(e) => {
                e.preventDefault();
                const from = replyFrom || owner;
                if (composer.trim() && from) {
                  sendMutation.mutate({ to: contact, content: composer, from });
                }
              }}
            >
              <input
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder="Escribe un mensaje…"
                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={sendMutation.isPending}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        )}
      </section>

      {/* Modal nuevo mensaje */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Nuevo mensaje</h2>
              <button type="button" onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600">
                <X size={22} />
              </button>
            </div>

            {phones && phones.length > 1 && (
              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-slate-600">Enviar desde</span>
                <select
                  value={fromPhone}
                  onChange={(e) => setFromPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
                >
                  {phones.map((p) => (
                    <option key={p.id} value={p.phone_number}>
                      {p.sim} — {p.phone_number}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="mb-3 block text-sm">
              <span className="mb-1 block text-slate-600">Número de teléfono</span>
              <PhoneInput
                country={country}
                onCountryChange={setCountry}
                value={newNumber}
                onChange={setNewNumber}
              />
            </label>

            <label className="mb-4 block text-sm">
              <span className="mb-1 block text-slate-600">Mensaje</span>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
                placeholder="Escribe tu SMS…"
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
              />
            </label>

            <button
              type="button"
              disabled={newMessageMutation.isPending || !newNumber.trim() || !newMessage.trim()}
              onClick={() => newMessageMutation.mutate()}
              className="w-full rounded-xl bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {newMessageMutation.isPending ? 'Enviando…' : 'Enviar SMS'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
