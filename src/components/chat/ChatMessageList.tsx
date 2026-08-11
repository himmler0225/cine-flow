import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { ChatToolAction } from "@/components/chat/ChatToolAction";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { ChatVideoPreviewList } from "@/components/chat/ChatVideoPreviewList";

const NEAR_BOTTOM_THRESHOLD = 80;

interface Props {
  messages: ChatMessage[];
}

export function ChatMessageList({ messages }: Props) {
  const { t } = useTranslation();

  const viewportRef = useRef<HTMLDivElement>(null);

  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const el = viewportRef.current;

    if (!el || !stickToBottomRef.current) return;

    const frame = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });

    return () => cancelAnimationFrame(frame);
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-netflix-red/10">
          <Bot className="h-6 w-6 text-netflix-red" />
        </div>
        <p className="text-sm font-medium text-white">{t("chat.emptyTitle")}</p>
        <p className="mt-1 max-w-xs text-xs text-netflix-muted">{t("chat.emptyHint")}</p>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      onScroll={(e) => {
        const el = e.currentTarget;

        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

        stickToBottomRef.current = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;
      }}
      className="h-full overflow-y-auto px-3 py-3 sm:px-4"
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
    >
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ChatMessageRow message={m} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChatMessageRow({ message }: { message: ChatMessage }) {
  const { t } = useTranslation();

  const mine = message.role === "user";

  const showThinking =
    !mine && message.status !== "error" && message.actions.length === 0 && !message.text;

  return (
    <div className={cn("flex gap-2", mine && "flex-row-reverse")}>
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          mine ? "bg-white/10" : "bg-netflix-red/15",
        )}
      >
        {mine ? (
          <User className="h-3.5 w-3.5 text-white" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-netflix-red" />
        )}
      </div>

      <div className={cn("max-w-[85%] flex-1 sm:max-w-[75%]", mine && "flex flex-col items-end")}>
        {message.actions.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <AnimatePresence initial={false}>
              {message.actions.map((a) => (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <ChatToolAction action={a} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {showThinking && (
          <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white/10 px-3 py-2 text-xs text-netflix-muted">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-netflix-muted [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-netflix-muted [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-netflix-muted" />
          </div>
        )}

        {message.text && (
          <div
            className={cn(
              "inline-block max-w-full break-words rounded-2xl px-3 py-2",
              mine
                ? "rounded-tr-sm bg-netflix-red text-sm text-white"
                : "rounded-tl-sm bg-white/10",
            )}
          >
            {mine ? (
              message.text
            ) : (
              <ChatMarkdown text={message.text} streaming={message.status === "streaming"} />
            )}
          </div>
        )}

        {message.status === "error" && (
          <p className="mt-1 text-xs text-red-400">
            {message.errorMessage || t("chat.genericError")}
          </p>
        )}

        {!mine && <ChatVideoPreviewList videos={message.videos} />}
      </div>
    </div>
  );
}
