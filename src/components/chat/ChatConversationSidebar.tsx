import { MessageSquarePlus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatRelativeTime } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useChatConversations } from "@/hooks/useChatConversations";
import { useChatStore } from "@/store/chatStore";
import type { AiConversation } from "@/types/chat";

interface Props {
  onSelect?: () => void;
}

export function ChatConversationSidebar({ onSelect }: Props) {
  const { t, i18n } = useTranslation();

  const { conversations, isLoading, deleteConversation } = useChatConversations();

  const activeId = useChatStore((s) => s.conversationId);

  const loadConversation = useChatStore((s) => s.loadConversation);

  const reset = useChatStore((s) => s.reset);

  const isStreaming = useChatStore((s) => s.isStreaming);

  const handleSelect = (conversation: AiConversation) => {
    if (isStreaming || conversation.id === activeId) return;

    void loadConversation(conversation.id);

    onSelect?.();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (!window.confirm(t("chat.deleteConfirm"))) return;

    void deleteConversation(id).then(() => {
      if (id === activeId) reset();
    });
  };

  return (
    <div className="flex h-full w-full flex-col border-r border-white/10 bg-black/20">
      <div className="shrink-0 p-2.5">
        <button
          type="button"
          onClick={() => {
            reset();

            onSelect?.();
          }}
          disabled={isStreaming}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          {t("chat.newChat")}
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
      >
        {isLoading ? (
          <p className="px-2 py-4 text-center text-[11px] text-netflix-muted">
            {t("chat.loadingConversations")}
          </p>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11px] text-netflix-muted">
            {t("chat.noConversations")}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(conversation)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleSelect(conversation);
                  }}
                  className={cn(
                    "group/item flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    conversation.id === activeId ? "bg-white/10" : "hover:bg-white/5",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-white">
                      {conversation.title || t("chat.untitledChat")}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-netflix-muted">
                      {formatRelativeTime(conversation.updated_at, i18n.language)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, conversation.id)}
                    className="shrink-0 rounded p-1 text-netflix-muted opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover/item:opacity-100"
                    aria-label={t("chat.deleteConversation")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
