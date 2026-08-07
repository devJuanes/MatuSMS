import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { MessageStatusIcon } from '@/components/MessageStatusIcon';
import { MessageListSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { encryptContent, getE2eKey, shouldEncryptByDefault } from '@/lib/e2e';
import type { Message } from '@matusms/shared';

export function ThreadDetailPage() {
  const { owner, contact } = useParams({ from: '/protected/threads/$owner/$contact' });
  const { getToken } = useAuth();
  const [content, setContent] = useState('');
  const qc = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['thread', owner, contact],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: Message[] }>(
        `/v1/threads/${encodeURIComponent(owner)}/${encodeURIComponent(contact)}/messages`,
        { token: token! },
      );
      return res.data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const key = getE2eKey();
      const useEncryption = shouldEncryptByDefault() && !!key;
      const payload = useEncryption && key
        ? { to: contact, content: encryptContent(content, key), from: owner, encrypted: true }
        : { to: contact, content, from: owner };
      return apiFetch('/v1/messages/send', {
        method: 'POST',
        token: token!,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setContent('');
      qc.invalidateQueries({ queryKey: ['thread', owner, contact] });
      qc.invalidateQueries({ queryKey: ['threads'] });
    },
  });

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <h1 className="mb-4 text-xl font-bold">
        {contact} <span className="text-sm font-normal text-zinc-500">vía {owner}</span>
      </h1>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        {isLoading && <MessageListSkeleton rows={4} />}
        {messages?.map((m) => {
          const outbound = m.type === 'mobile-terminated';
          return (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                outbound ? 'ml-auto bg-brand text-white' : 'bg-zinc-800 text-zinc-100'
              }`}
            >
              <p>{m.content}</p>
              <p className={`mt-1 flex items-center gap-1 text-xs ${outbound ? 'justify-end text-blue-100' : 'text-zinc-400'}`}>
                {outbound && <MessageStatusIcon status={m.status} outbound />}
              </p>
            </div>
          );
        })}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (content.trim()) sendMutation.mutate();
        }}
      >
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={sendMutation.isPending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {sendMutation.isPending ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
