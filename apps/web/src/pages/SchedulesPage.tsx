import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { MessageSendSchedule } from '@matusms/shared';

export function SchedulesPage() {
  const { getToken } = useAuth();
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
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

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Send schedules</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Define time windows when outbound SMS are allowed. Link a schedule to a phone in Phones settings.
      </p>

      <form
        className="mb-8 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Business hours"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm"
          required
        />
        <input
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="Timezone"
          className="w-48 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm text-white">
          Create (Mon–Fri 9am–5pm)
        </button>
      </form>

      {isLoading && <p className="text-zinc-400">Loading…</p>}
      <div className="space-y-3">
        {schedules?.map((s) => (
          <div key={s.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{s.name}</p>
              <button
                onClick={() => deleteMutation.mutate(s.id)}
                className="text-sm text-red-400 hover:underline"
              >
                Delete
              </button>
            </div>
            <p className="text-sm text-zinc-400">{s.timezone}</p>
            <ul className="mt-2 text-xs text-zinc-500">
              {s.windows.map((w, i) => (
                <li key={i}>
                  {dayNames[w.day_of_week]}: {Math.floor(w.start_minute / 60)}:
                  {String(w.start_minute % 60).padStart(2, '0')} –{' '}
                  {Math.floor(w.end_minute / 60)}:{String(w.end_minute % 60).padStart(2, '0')}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
