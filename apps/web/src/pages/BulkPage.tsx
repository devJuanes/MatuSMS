import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { TEMPLATE_EXAMPLES } from '@matusms/shared';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { BulkMessage, Phone } from '@matusms/shared';

type BulkRow = { to: string; content?: string; variables?: Record<string, string> };

function parseCsv(text: string): BulkRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const toIdx = headers.indexOf('to');
  const contentIdx = headers.indexOf('content');
  if (toIdx < 0) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const row: BulkRow = { to: cols[toIdx]?.trim() ?? '' };
    if (contentIdx >= 0) row.content = cols.slice(contentIdx).join(',').trim();
    const variables: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (h !== 'to' && h !== 'content' && cols[i]?.trim()) variables[h] = cols[i].trim();
    });
    if (Object.keys(variables).length) row.variables = variables;
    return row;
  }).filter((r) => r.to);
}

function parseExcel(buffer: ArrayBuffer): BulkRow[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
  return rows.map((row) => {
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) normalized[k.toLowerCase().trim()] = String(v).trim();
    const to = normalized.to || normalized.telefono || normalized.phone || '';
    const content = normalized.content || normalized.mensaje || normalized.message;
    const variables: Record<string, string> = {};
    for (const [k, v] of Object.entries(normalized)) {
      if (!['to', 'telefono', 'phone', 'content', 'mensaje', 'message'].includes(k) && v) {
        variables[k] = v;
      }
    }
    return {
      to,
      ...(content ? { content } : {}),
      ...(Object.keys(variables).length ? { variables } : {}),
    };
  }).filter((r) => r.to);
}

export function BulkPage() {
  const { getToken } = useAuth();
  const [mode, setMode] = useState<'csv' | 'template'>('template');
  const [template, setTemplate] = useState<string>(TEMPLATE_EXAMPLES.verification);
  const [csv, setCsv] = useState('to,nombre,codigo\n+573001234567,Juan,482910');
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
        ? 'to,nombre,codigo\n+573001234567,Juan,482910\n+573009876543,Maria,119203'
        : 'to,content\n+573001234567,Hola desde MatuSMS';
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'template' ? 'matusms-plantilla.csv' : 'matusms-mensajes.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const previewCount = rows.length || (mode === 'template' ? parseCsv(csv).length : parseCsv(csv).length);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Envío masivo</h1>
      <p className="mb-6 text-sm text-slate-600">
        Carga un Excel o CSV, usa plantillas con variables <code className="text-brand">{'{{nombre}}'}</code> para
        facturas, códigos OTP y notificaciones. Límite: 3 SMS/min.
      </p>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode('template')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'template' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}
        >
          Plantilla + variables
        </button>
        <button
          type="button"
          onClick={() => setMode('csv')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === 'csv' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}
        >
          Mensaje por fila
        </button>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm text-slate-600">Enviar desde</label>
        <select
          value={phoneId}
          onChange={(e) => setPhoneId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
        >
          <option value="">Teléfono por defecto</option>
          {phones?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sim} — {p.phone_number}
            </option>
          ))}
        </select>
      </div>

      {mode === 'template' && (
        <label className="mb-4 block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Plantilla del mensaje</span>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm"
            placeholder="Hola {{nombre}}, tu código es {{codigo}}"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(TEMPLATE_EXAMPLES).map(([key, text]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTemplate(text)}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200"
              >
                {key === 'verification' ? 'Código OTP' : 'Factura'}
              </button>
            ))}
          </div>
        </label>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          <Upload size={16} />
          Subir CSV / Excel
        </button>
        <button
          type="button"
          onClick={downloadTemplateCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          <Download size={16} />
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
        {fileName && (
          <span className="flex items-center gap-1 text-sm text-slate-500">
            <FileSpreadsheet size={16} />
            {fileName} ({previewCount} filas)
          </span>
        )}
      </div>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-slate-600">
          {mode === 'template'
            ? 'Datos (columnas: to, nombre, codigo, …)'
            : 'Datos (columnas: to, content)'}
        </span>
        <textarea
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value);
            setRows([]);
            setFileName(null);
          }}
          rows={8}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm"
        />
      </label>

      <button
        type="button"
        onClick={() => sendMutation.mutate()}
        disabled={sendMutation.isPending}
        className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {sendMutation.isPending ? 'Enviando…' : `Enviar ${previewCount} mensajes`}
      </button>

      {sendMutation.isError && (
        <p className="mt-3 text-sm text-red-600">{(sendMutation.error as Error).message}</p>
      )}

      <h2 className="mb-3 mt-10 text-lg font-semibold text-slate-900">Trabajos recientes</h2>
      {isLoading && <p className="text-slate-500">Cargando…</p>}
      <div className="space-y-2">
        {jobs?.map((j) => (
          <div key={j.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <span className="font-medium capitalize">{j.status}</span> — {j.success_count}/{j.total_count} enviados
            {j.failed_count > 0 && <span className="text-red-500"> ({j.failed_count} con error)</span>}
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="mb-2 font-semibold text-slate-800">API — envío con plantilla</p>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{`POST /v1/messages/send
{
  "to": "+573001234567",
  "content": "Hola {{nombre}}, tu código es {{codigo}}",
  "variables": { "nombre": "Juan", "codigo": "482910" },
  "from": "+57..."
}`}</pre>
      </section>
    </div>
  );
}
