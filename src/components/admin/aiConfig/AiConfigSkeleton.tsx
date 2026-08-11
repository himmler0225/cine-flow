export function AiConfigSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 rounded-lg bg-white/5 p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-md bg-white/10" />
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-9 w-full animate-pulse rounded-md bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
