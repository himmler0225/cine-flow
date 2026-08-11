import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatToolAction as ChatToolActionType } from "@/types/chat";

interface Props {
  action: ChatToolActionType;
}

export function ChatToolAction({ action }: Props) {
  const running = action.status === "running";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors duration-200",
        running
          ? "border-netflix-red/30 bg-netflix-red/10 text-netflix-red"
          : "border-white/10 bg-white/5 text-netflix-muted",
      )}
    >
      {running ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
      ) : (
        <Check className="h-3 w-3 shrink-0" />
      )}
      <span className="truncate">{action.detail}</span>
    </div>
  );
}
