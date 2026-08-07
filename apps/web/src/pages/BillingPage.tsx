import { useQuery } from '@tanstack/react-query';
import { BarChart3, CreditCard, MessageSquare, CalendarDays } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { BillingUsage, User } from '@matusms/shared';

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  'pro-monthly': 'Pro mensual',
  'pro-yearly': 'Pro anual',
  'ultra-monthly': 'Ultra mensual',
  'ultra-yearly': 'Ultra anual',
  '20k-monthly': '20K mensual',
  '20k-yearly': '20K anual',
};

function planLabel(name?: string | null) {
  if (!name) return 'Gratis';
  return PLAN_LABELS[name] ?? name;
}

function formatPeriod(period: string) {
  // Expect YYYY-MM
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export function BillingPage() {
  const { getToken } = useAuth();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: User }>('/v1/users/me', { token: token! });
      return res.data;
    },
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: BillingUsage[] }>('/v1/billing/usage', {
        token: token!,
      });
      return res.data;
    },
  });

  const isLoading = userLoading || usageLoading;

  const chartData = [...(usage ?? [])].reverse().map((u) => ({
    period: u.period,
    label: formatPeriod(u.period),
    messages: u.message_count,
  }));

  const currentMonth = usage?.[0];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Facturación</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Uso de SMS por mes. Plan actual:{' '}
            <span className="font-medium text-slate-700">{planLabel(user?.subscription_name)}</span>
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Periodo actual
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-28" />
            ) : (
              <p className="mt-1 text-2xl font-bold capitalize text-slate-900">
                {currentMonth?.period ? formatPeriod(currentMonth.period) : '—'}
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <MessageSquare className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Mensajes este mes
            </p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {(currentMonth?.message_count ?? 0).toLocaleString('es-CO')}
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <CreditCard className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plan</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {planLabel(user?.subscription_name)}
              </p>
            )}
          </article>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900">Uso mensual</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3" role="status" aria-label="Cargando uso">
              <span className="sr-only">Cargando uso…</span>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : null}

          {!isLoading && chartData.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-brand/40" aria-hidden />
              <p className="mt-4 font-medium text-slate-700">Sin datos de uso todavía</p>
              <p className="mt-1 text-sm text-slate-500">
                Cuando envíes SMS, el consumo aparecerá aquí por mes.
              </p>
            </div>
          ) : null}

          {!isLoading && chartData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="period"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                      fontSize: 13,
                    }}
                    labelFormatter={(label) => formatPeriod(String(label))}
                    formatter={(value) => [
                      `${Number(value).toLocaleString('es-CO')} mensajes`,
                      'Envíos',
                    ]}
                  />
                  <Bar dataKey="messages" fill="#f22f46" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </section>

        {user?.subscription_renews_at || user?.subscription_status ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Detalle del plan</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {user.subscription_status ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Estado
                  </dt>
                  <dd className="mt-1 text-sm font-medium capitalize text-slate-800">
                    {user.subscription_status}
                  </dd>
                </div>
              ) : null}
              {user.subscription_renews_at ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Renueva
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {new Date(user.subscription_renews_at).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}
