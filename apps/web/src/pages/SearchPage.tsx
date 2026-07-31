import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Search</h1>
      <form
        className="mb-8 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(q.trim());
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search messages and contacts…"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm text-white">
          Search
        </button>
      </form>

      {(isLoading || isFetching) && <p className="text-zinc-400">Searching…</p>}

      {submitted && data && (
        <>
          <h2 className="mb-3 text-lg font-semibold">Threads</h2>
          <div className="mb-8 space-y-2">
            {data.threads.map((t) => (
              <Link
                key={t.id}
                to="/threads/$owner/$contact"
                params={{ owner: t.owner, contact: t.contact }}
                className="block rounded-lg border border-zinc-800 bg-zinc-900 p-3 hover:border-brand/50"
              >
                <p className="font-medium">{t.contact}</p>
                <p className="truncate text-sm text-zinc-400">{t.last_message_content}</p>
              </Link>
            ))}
            {!data.threads.length && <p className="text-sm text-zinc-500">No threads found</p>}
          </div>

          <h2 className="mb-3 text-lg font-semibold">Messages</h2>
          <div className="space-y-2">
            {data.messages.map((m) => (
              <div key={m.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm">
                <p className="text-zinc-400">
                  {m.contact} · {m.status}
                </p>
                <p className="mt-1">{m.content}</p>
              </div>
            ))}
            {!data.messages.length && <p className="text-sm text-zinc-500">No messages found</p>}
          </div>
        </>
      )}
    </div>
  );
}
