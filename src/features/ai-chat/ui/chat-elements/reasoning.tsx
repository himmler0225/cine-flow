import { useState, type ReactNode } from "react";
import { ChevronDown, Brain } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type Props = { children: ReactNode; isStreaming?: boolean };

export function Reasoning({ children, isStreaming }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-[85%]">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-1 py-1 text-xs text-white/50 hover:text-white/80"
        >
          <Brain className={cn("h-3.5 w-3.5", isStreaming && "animate-pulse")} />
          Đang suy nghĩ...
          <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/60">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
