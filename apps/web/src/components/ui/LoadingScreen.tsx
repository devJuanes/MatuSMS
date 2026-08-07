export function LoadingScreen({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="marketing-bg flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <div className="relative flex h-11 w-11 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-brand/15" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand" />
          <img
            src="/favicon.png"
            alt=""
            width={22}
            height={22}
            className="relative h-[22px] w-[22px] rounded object-contain"
          />
        </div>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
