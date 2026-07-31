import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { MessageThread } from '@matusms/shared';

export function ThreadsPage() {
  const { user, getToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: MessageThread[] }>('/v1/threads', { token: token! });
      return res.data;
    },
    enabled: !!user,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Threads</h1>
      {isLoading && <p className="text-zinc-400">Loading…</p>}
      {!isLoading && !data?.length && (
        <div className="rounded-xl border border-dashed border-zinc-700 p-12 text-center text-zinc-400">
          No conversations yet. Send an SMS via the API to get started.
        </div>
      )}
      <div className="space-y-2">
        {data?.map((thread) => (
          <Link
            key={thread.id}
            to="/threads/$owner/$contact"
            params={{ owner: thread.owner, contact: thread.contact }}
            className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-brand/50"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">{thread.contact}</p>
              <span className="text-xs text-zinc-500">{thread.owner}</span>
            </div>
            <p className="mt-1 truncate text-sm text-zinc-400">{thread.last_message_content}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
