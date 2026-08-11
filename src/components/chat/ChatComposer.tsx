import { Send, Square } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_LENGTH } from "@/constants/file";

interface Props {
  disabled?: boolean;
  isStreaming: boolean;
  onSend: (text: string) => void | Promise<void>;
  onStop: () => void;
}

export function ChatComposer({ disabled, isStreaming, onSend, onStop }: Props) {
  const { t } = useTranslation();

  const [text, setText] = useState("");

  const canSend = !disabled && !isStreaming && text.trim().length > 0;

  const send = () => {
    if (!canSend) return;

    const message = text.trim();

    onSend(message);

    setText("");
  };

  return (
    <div className="shrink-0 border-t border-white/10 p-2.5">
      <div className="flex items-end gap-1.5">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              send();
            }
          }}
          placeholder={t("chat.placeholder")}
          rows={1}
          disabled={disabled}
          className="
            min-h-0
            flex-1
            resize-none
            border-white/15
            bg-black/40
            py-2
            text-sm
            text-white
            placeholder:text-netflix-muted
            focus-visible:border-netflix-red
            focus-visible:ring-0
            disabled:opacity-50
          "
        />

        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            onClick={onStop}
            className="
              h-9
              w-9
              shrink-0
              rounded-lg
              bg-white/10
              hover:bg-white/20
            "
            aria-label={t("chat.stop")}
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={send}
            disabled={!canSend}
            className="
              h-9
              w-9
              shrink-0
              rounded-lg
              bg-netflix-red
              hover:bg-netflix-red/80
              disabled:opacity-40
            "
            aria-label={t("chat.send")}
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
