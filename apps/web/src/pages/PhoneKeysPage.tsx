import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { Phone, PhoneApiKey } from '@matusms/shared';

export function PhoneKeysPage() {
  const { getToken } = useAuth();
  const [selectedPhoneId, setSelectedPhoneId] = useState('');
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: phones } = useQuery({
    queryKey: ['phones'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: Phone[] }>('/v1/phones', { token: token! });
      return res.data;
    },
  });

  const { data: keys, isLoading } = useQuery({
    queryKey: ['phone-api-keys'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiFetch<{ data: PhoneApiKey[] }>('/v1/phone-api-keys', {
        token: token!,
      });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (phoneId: string) => {
      const token = await getToken();
      return apiFetch<{ data: PhoneApiKey }>('/v1/phone-api-keys', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ phone_id: phoneId }),
      });
    },
    onSuccess: async (res) => {
      qc.invalidateQueries({ queryKey: ['phone-api-keys'] });
      const token = await getToken();
      const qr = await apiFetch<{ data: { payload: string } }>(
        `/v1/phone-api-keys/${res.data.id}/qr`,
        { token: token! },
      );
      setQrPayload(qr.data.payload);
    },
  });

  async function showQr(keyId: string) {
    const token = await getToken();
    const qr = await apiFetch<{ data: { payload: string } }>(
      `/v1/phone-api-keys/${keyId}/qr`,
      { token: token! },
    );
    setQrPayload(qr.data.payload);
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Phone API Keys</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Generate a key and scan the QR code with the MatuSMS Android app to link your phone.
      </p>

      <div className="mb-8 flex gap-2">
        <select
          value={selectedPhoneId}
          onChange={(e) => setSelectedPhoneId(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm"
        >
          <option value="">Select a phone…</option>
          {phones?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.phone_number}
            </option>
          ))}
        </select>
        <button
          disabled={!selectedPhoneId}
          onClick={() => createMutation.mutate(selectedPhoneId)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          Generate key + QR
        </button>
      </div>

      {qrPayload && (
        <div className="mb-8 flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 p-8">
          <p className="mb-4 text-sm text-zinc-400">Scan with MatuSMS app</p>
          <QRCodeSVG value={qrPayload} size={200} bgColor="#18181b" fgColor="#ffffff" />
        </div>
      )}

      {isLoading && <p className="text-zinc-400">Loading…</p>}
      <div className="space-y-2">
        {keys?.map((key) => {
          const phone = phones?.find((p) => p.id === key.phone_id);
          return (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div>
                <p className="font-mono text-sm">{key.api_key.slice(0, 12)}…</p>
                <p className="text-xs text-zinc-500">{phone?.phone_number ?? key.phone_id}</p>
              </div>
              <button
                onClick={() => showQr(key.id)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
              >
                Show QR
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
