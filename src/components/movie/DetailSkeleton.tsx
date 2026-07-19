export function DetailSkeleton() {
  return (
    <div className="relative min-h-[70vh] overflow-hidden bg-netflix-dark">
      <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/70 to-netflix-surface" />
      <div className="relative z-10 flex flex-col gap-8 px-4 pt-24 pb-10 md:flex-row md:px-12">
        <div className="aspect-[2/3] w-48 flex-none animate-pulse rounded-lg bg-netflix-surface md:w-64" />
        <div className="flex-1 space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-netflix-surface md:h-14" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-netflix-surface" />
          <div className="flex gap-2">
            <div className="h-6 w-14 animate-pulse rounded bg-netflix-surface" />
            <div className="h-6 w-20 animate-pulse rounded bg-netflix-surface" />
            <div className="h-6 w-16 animate-pulse rounded bg-netflix-surface" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-netflix-surface" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-netflix-surface" />
            <div className="h-4 w-full animate-pulse rounded bg-netflix-surface" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-netflix-surface" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-netflix-surface" />
          </div>
          <div className="flex gap-3 pt-2">
            <div className="h-11 w-36 animate-pulse rounded bg-netflix-red/40" />
            <div className="h-11 w-36 animate-pulse rounded bg-netflix-surface" />
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-8 px-4 md:px-12">
        <div className="mb-3 h-6 w-48 animate-pulse rounded bg-netflix-surface" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] w-[140px] flex-none animate-pulse rounded-md bg-netflix-surface md:w-[180px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
