import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Send, X } from "lucide-react";
import { DANMAKU_MAX_LENGTH } from "@/services/platform/danmaku.service";

interface Props {
  onSend: (content: string) => Promise<void>;
  onClose: () => void;
}

/** One-line input over the player for sending a time-coded comment. */
export function DanmakuComposer({ onSend, onClose }: Props) {
  const { t } = useTranslation();

  const [text, setText] = useState("");

  const [sending, setSending] = useState(false);

  const submit = async () => {
    const content = text.trim();

    if (!content || sending) return;

    setSending(true);

    try {
      await onSend(content);

      setText("");
    } catch {
      toast.error(t("player.danmakuSendFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        void submit();
      }}
      // Typing must not reach the gesture surface or the keyboard shortcuts.
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute inset-x-3 bottom-20 z-30 mx-auto flex max-w-xl items-center gap-2 rounded-full bg-black/80 py-1 pl-4 pr-1 ring-1 ring-white/15 backdrop-blur-sm sm:bottom-24"
    >
      <input
        autoFocus
        value={text}
        maxLength={DANMAKU_MAX_LENGTH}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        placeholder={t("player.danmakuPlaceholder")}
        aria-label={t("player.danmakuPlaceholder")}
        className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!text.trim() || sending}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-netflix-red text-white disabled:opacity-40"
        aria-label={t("player.danmakuSend")}
      >
        <Send className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10"
        aria-label={t("common.close")}
      >
        <X className="h-4 w-4" />
      </button>
    </form>
  );
}
