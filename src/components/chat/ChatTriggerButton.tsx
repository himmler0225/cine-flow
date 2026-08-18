import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/store/chatStore";

export function ChatTriggerButton() {
  const { t } = useTranslation();

  const open = useChatStore((s) => s.open);

  const isOpen = useChatStore((s) => s.isOpen);

  const [greetingDismissed, setGreetingDismissed] = useState(false);

  if (isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 sm:bottom-8 sm:right-6">
      {!greetingDismissed && (
        <div
          className="absolute bottom-full right-0 mb-3 w-56 rounded-2xl rounded-br-sm border border-white/10 bg-netflix-dark/95 px-4 py-3 text-sm text-white opacity-0 shadow-2xl shadow-black/50 backdrop-blur-sm"
          style={{ animation: "ai-trigger-bubble-in 0.5s ease-out 1s forwards" }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();

              setGreetingDismissed(true);
            }}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-netflix-gray text-netflix-muted hover:bg-white/20 hover:text-white"
            aria-label={t("chat.closeAria")}
          >
            <X className="h-3 w-3" />
          </button>
          {t("chat.triggerGreeting")}
          <span
            className="absolute -bottom-1.5 right-7 h-3 w-3 rotate-45 border-b border-r border-white/10 bg-netflix-dark/95"
            aria-hidden="true"
          />
        </div>
      )}

      <button
        type="button"
        onClick={open}
        className="group relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24"
        aria-label={t("chat.triggerAria")}
      >
        <span
          className="absolute inset-0 rounded-full bg-netflix-red/50 blur-xl"
          style={{ animation: "ai-trigger-glow 2.4s ease-in-out infinite" }}
          aria-hidden="true"
        />
        <img
          src="/ai.png"
          alt=""
          className="relative h-full w-full object-contain drop-shadow-[0_6px_18px_rgba(229,9,20,0.55)] transition-transform duration-300 group-hover:scale-110"
          style={{ animation: "ai-trigger-float 3s ease-in-out infinite" }}
        />
      </button>
    </div>
  );
}
