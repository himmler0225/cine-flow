import { useState, type ReactNode } from "react";
import { ChevronDown, Link2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function Sources({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-[85%]">
      {children}
    </Collapsible>
  );
}

export function SourcesTrigger({ count }: { count: number }) {
  return (
    <CollapsibleTrigger asChild>
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-md px-1 py-1 text-xs text-white/50 hover:text-white/80"
      >
        <Link2 className="h-3.5 w-3.5" />
        {count} nguồn
        <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
      </button>
    </CollapsibleTrigger>
  );
}

export function SourcesContent({ children }: { children: ReactNode }) {
  return (
    <CollapsibleContent className="flex flex-col gap-1 rounded-lg bg-white/[0.03] px-3 py-2">
      {children}
    </CollapsibleContent>
  );
}

export function Source({ href, title }: { href: string; title: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn("truncate text-xs text-blue-400 hover:underline")}
    >
      {title}
    </a>
  );
}
