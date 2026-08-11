import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";

export function Section({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export function SectionLoader({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 w-full animate-pulse rounded-md bg-white/5"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}

export function SectionEmpty({ message }: { message: string }) {
  return (
    <Empty className="border-0 p-6 md:p-8">
      <EmptyHeader>
        <EmptyDescription className="text-zinc-500">{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
