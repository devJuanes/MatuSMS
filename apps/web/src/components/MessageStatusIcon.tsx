import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  sending: 'Enviando',
  scheduled: 'Programado',
  sent: 'Enviado',
  delivered: 'Entregado',
  received: 'Recibido',
  failed: 'Error',
  expired: 'Expirado',
};

export function messageStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

type MessageStatusIconProps = {
  status: string;
  className?: string;
  outbound?: boolean;
};

export function MessageStatusIcon({ status, className = 'h-3.5 w-3.5', outbound }: MessageStatusIconProps) {
  const title = messageStatusLabel(status);
  const color =
    status === 'failed' || status === 'expired'
      ? outbound
        ? 'text-red-200'
        : 'text-red-500'
      : outbound
        ? 'text-blue-100'
        : 'text-slate-400';

  let icon;
  if (status === 'pending' || status === 'sending' || status === 'scheduled') {
    icon = <Clock className={`${className} ${color}`} aria-hidden />;
  } else if (status === 'sent') {
    icon = <Check className={`${className} ${color}`} aria-hidden />;
  } else if (status === 'delivered' || status === 'received') {
    icon = <CheckCheck className={`${className} ${color}`} aria-hidden />;
  } else if (status === 'failed' || status === 'expired') {
    icon = <AlertCircle className={`${className} ${color}`} aria-hidden />;
  } else {
    icon = <Clock className={`${className} ${color}`} aria-hidden />;
  }

  return (
    <span title={title} aria-label={title} className="inline-flex">
      {icon}
    </span>
  );
}
