export function PageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-netflix-black">
      <div className="flex h-16 items-center gap-6 border-b border-white/10 px-4 md:px-12">
        <div className="h-6 w-24 animate-pulse rounded bg-white/10" />
        <div className="hidden gap-4 md:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-14 animate-pulse rounded bg-white/5" />
          ))}
        </div>
        <div className="ml-auto h-9 w-9 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-10 md:px-12">
        <div className="h-56 w-full animate-pulse rounded-xl bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
