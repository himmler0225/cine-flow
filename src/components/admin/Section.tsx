import { Loader2 } from "lucide-react";
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

export function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-10 text-zinc-500">
      <Loader2 className="h-5 w-5 animate-spin" />
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
