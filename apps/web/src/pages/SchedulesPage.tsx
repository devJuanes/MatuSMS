import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Clock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { MessageSendSchedule } from '@matusms/shared';

const TIMEZONES = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Lima',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Caracas',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Madrid',
  'UTC',
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatMinute(minute: number) {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function SchedulesPage() {
  const { getToken } = useAuth();
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('America/Bogota');
  const qc = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: MessageSendSchedule[] }>('/v1/schedules', {
        token: token!,
      });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch('/v1/schedules', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({
          name,
          timezone,
          windows: [
            { day_of_week: 1, start_minute: 540, end_minute: 1020 },
            { day_of_week: 2, start_minute: 540, end_minute: 1020 },
            { day_of_week: 3, start_minute: 540, end_minute: 1020 },
            { day_of_week: 4, start_minute: 540, end_minute: 1020 },
            { day_of_week: 5, start_minute: 540, end_minute: 1020 },
          ],
        }),
      });
    },
    onSuccess: () => {
      setName('');
      qc.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch(`/v1/schedules/${id}`, { method: 'DELETE', token: token! });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Horarios de envío</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Define ventanas en las que se permiten SMS salientes. Luego vincula un horario a un
            teléfono en{' '}
            <Link to="/phones" className="font-medium text-brand hover:underline">
              Teléfonos
            </Link>
            .
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900">Crear horario</h2>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Plantilla rápida: lunes a viernes, 09:00 – 17:00.
          </p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="schedule-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  id="schedule-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Horario laboral"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="schedule-tz"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Zona horaria
                </label>
                <select
                  id="schedule-tz"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Lun–Vie · 09:00–17:00 · {timezone}
              </p>
              <button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creando…' : 'Crear horario'}
              </button>
            </div>

            {createMutation.isError ? (
              <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                {(createMutation.error as Error).message || 'No se pudo crear el horario'}
              </p>
            ) : null}
          </form>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Tus horarios</h2>

          {isLoading ? <CardListSkeleton rows={2} /> : null}

          {!isLoading && !schedules?.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
              <CalendarClock className="mx-auto h-10 w-10 text-brand/40" aria-hidden />
              <p className="mt-4 font-medium text-slate-700">Sin horarios todavía</p>
              <p className="mt-1 text-sm text-slate-500">
                Crea uno para limitar envíos a horas laborales.
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            {schedules?.map((s) => (
              <article
                key={s.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{s.name}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{s.timezone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(s.id)}
                    disabled={deleteMutation.isPending}
                    className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    aria-label={`Eliminar horario ${s.name}`}
                  >
                    <Trash2 size={15} />
                    Eliminar
                  </button>
                </div>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {s.windows.map((w, i) => (
                    <li
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                    >
                      <span className="text-brand">{DAY_NAMES[w.day_of_week]}</span>
                      <span className="text-slate-400">·</span>
                      <span>
                        {formatMinute(w.start_minute)} – {formatMinute(w.end_minute)}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
