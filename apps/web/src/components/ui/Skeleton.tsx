type SkeletonProps = {
  className?: string;
};

/** Soft pulse block — use for custom layouts */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`matu-skeleton rounded-md ${className}`} aria-hidden />;
}

/** Conversation list placeholders (Mensajes sidebar) */
export function ThreadListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Cargando conversaciones">
      <span className="sr-only">Cargando conversaciones…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 border-b border-slate-50 px-5 py-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2.5 py-0.5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-[42%]" />
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
            <Skeleton className="h-3 w-[78%]" />
            <Skeleton className="h-2.5 w-[30%]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Chat bubbles placeholders */
export function MessageListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Cargando mensajes">
      <span className="sr-only">Cargando mensajes…</span>
      {Array.from({ length: rows }).map((_, i) => {
        const outbound = i % 2 === 1;
        return (
          <div key={i} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
            <Skeleton
              className={`h-14 max-w-[70%] rounded-2xl ${
                outbound ? 'w-[55%] rounded-br-md' : 'w-[60%] rounded-bl-md'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Card grid / list for phones, settings, bulk, etc. */
export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando">
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <Skeleton className="h-4 w-[40%]" />
              <Skeleton className="h-3 w-[65%]" />
              <Skeleton className="h-3 w-[28%]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Compact inline loader — non-blocking hint under headers */
export function SoftLoader({ label = 'Cargando' }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-2.5 py-2 text-sm text-slate-400"
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-4 w-4">
        <span className="absolute inset-0 rounded-full border-2 border-brand/20" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand" />
      </span>
      <span>{label}</span>
    </div>
  );
}
