import { useEffect, useRef, useState, type ReactNode, type UIEvent } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Re-run the "stick to bottom" auto-scroll whenever this changes (e.g. message count, last message length). */
  autoScrollKey?: unknown;
};

/** Scroll container that sticks to the bottom while streaming, with a jump-to-bottom button when scrolled up. */
export function Conversation({ children, className, autoScrollKey }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [autoScrollKey]);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    stickToBottom.current = atBottom;
    setShowJump(!atBottom);
  };

  const jumpToBottom = () => {
    const el = ref.current;
    if (!el) return;
    stickToBottom.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      <div ref={ref} onScroll={onScroll} className="h-full overflow-y-auto">
        {children}
      </div>
      {showJump && (
        <Button
          size="icon"
          variant="secondary"
          onClick={jumpToBottom}
          className="absolute bottom-3 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full shadow-lg"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function ConversationContent({ children, className }: Props) {
  return <div className={cn("flex flex-col gap-4 py-4", className)}>{children}</div>;
}
