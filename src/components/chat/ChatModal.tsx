import { Bot, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chatStore";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatComposer } from "@/components/chat/ChatComposer";

export function ChatModal() {
  const { t, i18n } = useTranslation();
  const isOpen = useChatStore((s) => s.isOpen);
  const close = useChatStore((s) => s.close);
  const reset = useChatStore((s) => s.reset);
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const stop = useChatStore((s) => s.stop);

  const lang = i18n.language?.startsWith("en") ? "en" : "vi";

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex h-[85vh] max-h-[720px] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden border-white/10 bg-[#141414] p-0 text-white sm:h-[700px]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
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
      </DialogContent>
    </Dialog>
  );
}
