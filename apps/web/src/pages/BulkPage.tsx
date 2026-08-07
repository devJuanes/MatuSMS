import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { TEMPLATE_EXAMPLES } from '@matusms/shared';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { resolveBulkPhone } from '@/lib/phone-input';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import type { BulkMessage, Phone } from '@matusms/shared';

type BulkRow = { to: string; content?: string; variables?: Record<string, string> };

function rowToBulkEntry(row: Record<string, string>): BulkRow | null {
  const to = resolveBulkPhone(row);
  if (!to) return null;
  const content = row.content || row.mensaje || row.message;
  const variables: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.toLowerCase().trim();
    if (
      ![
        'to',
        'telefono',
        'phone',
        'numero',
        'celular',
        'content',
        'mensaje',
        'message',
        'codigo',
        'codigo_pais',
        'dial',
        'country_code',
        'pais',
      ].includes(key) &&
      v?.trim()
    ) {
      variables[key] = v.trim();
    }
  }
  return {
    to,
    ...(content ? { content } : {}),
    ...(Object.keys(variables).length ? { variables } : {}),
  };
}

function parseCsv(text: string): BulkRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const toIdx = headers.indexOf('to');
  const telefonoIdx = headers.indexOf('telefono');
  const phoneIdx = headers.indexOf('phone');
  if (toIdx < 0 && telefonoIdx < 0 && phoneIdx < 0) return [];

  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = cols[i]?.trim() ?? '';
      });
      return rowToBulkEntry(row);
    })
    .filter((r): r is BulkRow => r != null);
}

function parseExcel(buffer: ArrayBuffer): BulkRow[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
  return rows
    .map((row) => {
      const normalized: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) normalized[k.toLowerCase().trim()] = String(v).trim();
      return rowToBulkEntry(normalized);
    })
    .filter((r): r is BulkRow => r != null);
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    completed: 'Completado',
    failed: 'Fallido',
    queued: 'En cola',
  };
  return map[status] ?? status;
}

function statusClass(status: string) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'failed') return 'bg-red-50 text-red-700 ring-red-200';
  if (status === 'processing' || status === 'queued' || status === 'pending') {
    return 'bg-amber-50 text-amber-800 ring-amber-200';
  }
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

export function BulkPage() {
  const { getToken } = useAuth();
  const [mode, setMode] = useState<'csv' | 'template'>('template');
  const [template, setTemplate] = useState<string>(TEMPLATE_EXAMPLES.verification);
  const [csv, setCsv] = useState('codigo_pais,telefono,nombre,codigo\n57,3001234567,Juan,482910');
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [phoneId, setPhoneId] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: phones } = useQuery({
    queryKey: ['phones'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: Phone[] }>('/v1/phones', { token: token! });
      return res.data;
    },
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['bulk-jobs'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: BulkMessage[] }>('/v1/bulk-messages', { token: token! });
      return res.data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const parsed = rows.length > 0 ? rows : parseCsv(csv);
      if (!parsed.length) throw new Error('No hay destinatarios válidos');

      const body =
        mode === 'template'
          ? {
              phone_id: phoneId || undefined,
              filename: fileName ?? 'plantilla.csv',
              template,
              messages: parsed.map((r) => ({ to: r.to, variables: r.variables })),
            }
          : {
              phone_id: phoneId || undefined,
              filename: fileName ?? 'lista.csv',
              messages: parsed.map((r) => ({ to: r.to, content: r.content ?? '' })),
            };

      return apiFetch('/v1/messages/bulk-send', {
        method: 'POST',
        token: token!,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bulk-jobs'] }),
  });

  async function onFile(file: File) {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setRows(parseExcel(buf));
    } else {
      const text = new TextDecoder().decode(buf);
      setRows(parseCsv(text));
      setCsv(text);
    }
  }

  function downloadTemplateCsv() {
    const sample =
      mode === 'template'
        ? 'codigo_pais,telefono,nombre,codigo\n57,3001234567,Juan,482910\n57,3009876543,Maria,119203'
        : 'codigo_pais,telefono,content\n57,3001234567,Hola desde MatuSMS';
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'template' ? 'matusms-plantilla.csv' : 'matusms-mensajes.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const previewCount = rows.length || parseCsv(csv).length;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Envío masivo</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Sube un Excel o CSV y envía muchos SMS de una vez. Usa columnas{' '}
            <code className="rounded bg-brand-light px-1.5 py-0.5 text-xs font-medium text-brand">
              codigo_pais
            </code>
            ,{' '}
            <code className="rounded bg-brand-light px-1.5 py-0.5 text-xs font-medium text-brand">
              telefono
            </code>{' '}
            y variables como{' '}
            <code className="rounded bg-brand-light px-1.5 py-0.5 text-xs font-medium text-brand">
              nombre
            </code>
            . Límite de cola: 12 SMS/min.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div
            className="mb-5 flex rounded-xl bg-slate-100 p-1"
            role="tablist"
            aria-label="Modo de envío"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'template'}
              onClick={() => setMode('template')}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                mode === 'template'
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plantilla + variables
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'csv'}
              onClick={() => setMode('csv')}
              className={`flex-1 cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                mode === 'csv'
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mensaje por fila
            </button>
          </div>

          <div className="mb-5">
            <label htmlFor="bulk-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
              Enviar desde
            </label>
            <select
              id="bulk-phone"
              value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Teléfono por defecto</option>
              {phones?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sim} — {p.phone_number}
                </option>
              ))}
            </select>
          </div>

          {mode === 'template' ? (
            <div className="mb-5">
              <label htmlFor="bulk-template" className="mb-1.5 block text-sm font-medium text-slate-700">
                Plantilla del mensaje
              </label>
              <textarea
                id="bulk-template"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="Hola {{nombre}}, tu código es {{codigo}}"
              />
              <div className="mt-2.5 flex flex-wrap gap-2">
                {Object.entries(TEMPLATE_EXAMPLES).map(([key, text]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTemplate(text)}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand/30 hover:bg-brand-light hover:text-brand"
                  >
                    {key === 'verification' ? 'Código OTP' : 'Factura'}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Upload size={16} className="text-brand" />
              Subir CSV / Excel
            </button>
            <button
              type="button"
              onClick={downloadTemplateCsv}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Download size={16} className="text-slate-500" />
              Descargar plantilla
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
            {fileName ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
                <FileSpreadsheet size={15} className="text-brand" />
                {fileName}
                <span className="text-slate-400">· {previewCount} filas</span>
              </span>
            ) : null}
          </div>

          <div>
            <label htmlFor="bulk-data" className="mb-1.5 block text-sm font-medium text-slate-700">
              {mode === 'template'
                ? 'Datos (codigo_pais, telefono, nombre, codigo, …)'
                : 'Datos (codigo_pais, telefono, content)'}
            </label>
            <textarea
              id="bulk-data"
              value={csv}
              onChange={(e) => {
                setCsv(e.target.value);
                setRows([]);
                setFileName(null);
              }}
              rows={8}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-800 outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Listos para enviar:{' '}
              <span className="font-semibold text-slate-800">{previewCount}</span>
            </p>
            <button
              type="button"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending || previewCount === 0}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sendMutation.isPending
                ? 'Enviando…'
                : `Enviar ${previewCount} mensaje${previewCount === 1 ? '' : 's'}`}
            </button>
          </div>

          {sendMutation.isError ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
              <XCircle size={16} />
              {(sendMutation.error as Error).message}
            </p>
          ) : null}
          {sendMutation.isSuccess ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700" role="status">
              <CheckCircle2 size={16} />
              Envío encolado correctamente.
            </p>
          ) : null}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Trabajos recientes</h2>
          {isLoading ? <CardListSkeleton rows={2} /> : null}
          {!isLoading && !jobs?.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
              <p className="font-medium text-slate-700">Aún no hay envíos masivos</p>
              <p className="mt-1 text-sm text-slate-500">Cuando envíes un lote, aparecerá aquí.</p>
            </div>
          ) : null}
          <div className="space-y-2">
            {jobs?.map((j) => (
              <div
                key={j.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusClass(j.status)}`}
                  >
                    {statusLabel(j.status)}
                  </span>
                  <p className="mt-1.5 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">
                      {j.success_count}/{j.total_count}
                    </span>{' '}
                    enviados
                    {j.failed_count > 0 ? (
                      <span className="text-red-600"> · {j.failed_count} con error</span>
                    ) : null}
                  </p>
                </div>
                {j.filename ? (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <FileSpreadsheet size={14} />
                    {j.filename}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-800">API — envío con plantilla</p>
          <pre className="overflow-x-auto rounded-xl bg-ink p-4 font-mono text-xs leading-relaxed text-neutral-200">{`POST /v1/messages/send
{
  "to": "+573001234567",
  "content": "Hola {{nombre}}, tu código es {{codigo}}",
  "variables": { "nombre": "Juan", "codigo": "482910" },
  "from": "+57..."
}`}</pre>
        </section>
      </div>
    </div>
  );
}
