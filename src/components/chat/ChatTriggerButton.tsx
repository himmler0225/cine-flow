import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/store/chatStore";

export function ChatTriggerButton() {
  const { t } = useTranslation();
  const open = useChatStore((s) => s.open);
  return (
    <button
      type="button"
      onClick={open}
      className="relative rounded-full p-2 text-white hover:bg-white/10"
      aria-label={t("chat.triggerAria")}
    >
      <Sparkles className="h-5 w-5" />
    </button>
  );
}
