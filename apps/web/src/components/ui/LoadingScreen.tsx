export function LoadingScreen({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="marketing-bg flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
