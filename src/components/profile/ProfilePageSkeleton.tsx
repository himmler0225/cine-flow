export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-netflix-black pt-20 pb-16">
      <div className="mx-auto max-w-6xl space-y-6 px-4 md:px-8">
        <div className="h-44 animate-pulse rounded-xl bg-netflix-surface" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-netflix-surface" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-netflix-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
