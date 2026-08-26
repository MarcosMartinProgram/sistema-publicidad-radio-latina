export function Spinner({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-body-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
      <span className="text-headline-sm text-on-surface">{title}</span>
      {description && <span className="text-body-md text-on-surface-variant">{description}</span>}
    </div>
  );
}
