import { useState } from "react";
import { ChevronDown, Loader2, Check, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  isStatusOnlyInput,
  isCompletedOnlyOutput,
  toolStatusDetail,
} from "@/features/ai-chat/stream/toolStatus";

type ToolState = "input-streaming" | "input-available" | "output-available" | "output-error";

type Props = {
  toolName: string;
  state: ToolState;
  input: unknown;
  output?: unknown;
  errorText?: string;
};

const STATE_ICON: Record<ToolState, React.ReactNode> = {
  "input-streaming": <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />,
  "input-available": <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />,
  "output-available": <Check className="h-3.5 w-3.5 text-emerald-400" />,
  "output-error": <X className="h-3.5 w-3.5 text-red-400" />,
};

/** Collapsible tool-call card. Falls back to a lightweight status line for synthetic "status ping" tool calls. */
export function Tool({ toolName, state, input, output, errorText }: Props) {
  const [open, setOpen] = useState(false);

  const statusDetail = toolStatusDetail(input);
  if (statusDetail && (state === "input-available" || isCompletedOnlyOutput(output))) {
    return (
      <div className="flex items-center gap-1.5 px-1 text-xs text-white/50">
        {STATE_ICON[isCompletedOnlyOutput(output) ? "output-available" : state]}
        {statusDetail}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-[85%]">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/70 hover:bg-white/[0.06]"
        >
          {STATE_ICON[state]}
          <Badge variant="secondary" className="font-mono text-[10px]">
            {toolName}
          </Badge>
          <ChevronDown
            className={cn("ml-auto h-3 w-3 transition-transform", open && "rotate-180")}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 rounded-b-lg bg-black/20 p-3 text-xs">
        {!isStatusOnlyInput(input) && (
          <pre className="overflow-x-auto whitespace-pre-wrap text-white/60">
            {JSON.stringify(input, null, 2)}
          </pre>
        )}
        {output != null && (
          <pre className="overflow-x-auto whitespace-pre-wrap text-emerald-300/80">
            {JSON.stringify(output, null, 2)}
          </pre>
        )}
        {errorText && <p className="text-red-400">{errorText}</p>}
      </CollapsibleContent>
    </Collapsible>
  );
}
