import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { BillingUsage, User } from '@matusms/shared';

export function BillingPage() {
  const { getToken } = useAuth();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: User }>('/v1/users/me', { token: token! });
      return res.data;
    },
  });

  const { data: usage, isLoading } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: BillingUsage[] }>('/v1/billing/usage', {
        token: token!,
      });
      return res.data;
    },
  });

  const chartData = [...(usage ?? [])].reverse().map((u) => ({
    period: u.period,
    messages: u.message_count,
  }));

  const currentMonth = usage?.[0];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Billing</h1>
      <p className="mb-6 text-sm text-zinc-400">SMS usage by month. Plan: {user?.subscription_name}</p>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Current period</p>
          <p className="text-2xl font-bold">{currentMonth?.period ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Messages this month</p>
          <p className="text-2xl font-bold">{currentMonth?.message_count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Plan</p>
          <p className="text-2xl font-bold capitalize">{user?.subscription_name ?? 'free'}</p>
        </div>
      </div>

      {isLoading && <p className="text-zinc-400">Loading…</p>}
      {chartData.length > 0 && (
        <div className="h-72 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="period" stroke="#a1a1aa" fontSize={12} />
              <YAxis stroke="#a1a1aa" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }}
                labelStyle={{ color: '#e4e4e7' }}
              />
              <Bar dataKey="messages" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
