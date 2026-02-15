export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <span
          className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-text-secondary">Chargement...</p>
      </div>
    </div>
  );
}
