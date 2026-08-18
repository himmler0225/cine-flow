import { Bot, PanelLeft, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chatStore";
import { useChatConversations } from "@/hooks/useChatConversations";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatConversationSidebar } from "@/components/chat/ChatConversationSidebar";

export function ChatModal() {
  const { t, i18n } = useTranslation();

  const isOpen = useChatStore((s) => s.isOpen);

  const close = useChatStore((s) => s.close);

  const reset = useChatStore((s) => s.reset);

  const messages = useChatStore((s) => s.messages);

  const conversationId = useChatStore((s) => s.conversationId);

  const loadConversation = useChatStore((s) => s.loadConversation);

  const isStreaming = useChatStore((s) => s.isStreaming);

  const sendMessage = useChatStore((s) => s.sendMessage);

  const stop = useChatStore((s) => s.stop);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { conversations, isLoading: conversationsLoading } = useChatConversations();

  const autoLoadedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || autoLoadedRef.current || conversationsLoading) return;

    autoLoadedRef.current = true;

    if (!conversationId && messages.length === 0 && conversations.length > 0) {
      void loadConversation(conversations[0]!.id);
    }
  }, [
    isOpen,
    conversationsLoading,
    conversationId,
    messages.length,
    conversations,
    loadConversation,
  ]);

  const lang = i18n.language?.startsWith("en") ? "en" : "vi";

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex h-[85vh] max-h-[720px] w-[calc(100%-2rem)] max-w-4xl flex-row gap-0 overflow-hidden border-white/10 bg-[#141414] p-0 text-white sm:h-[700px]">
        <div className="hidden w-56 shrink-0 sm:block">
          <ChatConversationSidebar />
        </div>

        {mobileSidebarOpen && (
          <div className="absolute inset-0 z-20 sm:hidden">
            <ChatConversationSidebar onSelect={() => setMobileSidebarOpen(false)} />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 py-3 pl-4 pr-12">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen((v) => !v)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-netflix-muted hover:bg-white/10 hover:text-white sm:hidden"
                aria-label={t("chat.conversations")}
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-netflix-red/15">
                <Bot className="h-4 w-4 text-netflix-red" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-white">
                  {t("chat.title")}
                </DialogTitle>
                <p className="text-[11px] text-netflix-muted">{t("chat.subtitle")}</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={reset}
                disabled={isStreaming}
                className="h-8 w-8 text-netflix-muted hover:bg-white/10 hover:text-white"
                aria-label={t("chat.newChat")}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="min-h-0 flex-1">
            <ChatMessageList messages={messages} />
          </div>

          <ChatComposer
            isStreaming={isStreaming}
            onSend={(text) => void sendMessage(text, lang)}
            onStop={stop}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
