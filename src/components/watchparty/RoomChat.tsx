import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getIntlLocale } from "@/lib/i18n";
import { UI_DELAY_MS } from "@/constants/timing";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { RoomMessage } from "@/types/watchParty";

const REACTIONS = ["😂", "😭", "😱", "🔥", "👏", "❤️"];

interface Props {
  messages: RoomMessage[];
  meId: string | undefined;
  onSend: (content: string) => void;
  onReact: (emoji: string) => void;
  disabled?: boolean;
}

export function RoomChat({ messages, meId, onSend, onReact, disabled }: Props) {
  const { t, i18n } = useTranslation();

  const [text, setText] = useState("");

  const viewportRef = useRef<HTMLDivElement>(null);

  const [floats, setFloats] = useState<
    {
      id: number;
      emoji: string;
      x: number;
    }[]
  >([]);

  useEffect(() => {
    const el = viewportRef.current;

    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = () => {
    if (!text.trim() || disabled) return;

    onSend(text);

    setText("");
  };

  const react = (emoji: string) => {
    if (disabled) return;

    onReact(emoji);

    const id = Date.now() + Math.random();

    const x = 25 + Math.random() * 50;

    setFloats((f) => [...f, { id, emoji, x }]);

    window.setTimeout(
      () => setFloats((f) => f.filter((item) => item.id !== id)),
      UI_DELAY_MS.chatFloat,
    );
  };

  const timeLocale = getIntlLocale(i18n.language);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="shrink-0 border-b border-white/10 px-3 py-2.5">
        <p className="text-sm font-semibold text-white">{t("watchparty.liveChatHeader")}</p>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={viewportRef}
          className="h-full overflow-y-auto px-3 py-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
        >
          {messages.length === 0 && (
            <p className="py-8 text-center text-xs text-netflix-muted">
              {t("watchparty.firstMessage")}
            </p>
          )}
          <div className="space-y-2.5">
            {messages.map((m) => {
              if (m.type === "system") {
                return (
                  <div key={m.id} className="text-center text-[11px] italic text-netflix-muted/70">
                    {m.content}
                  </div>
                );
              }

              if (m.type === "reaction") {
                return (
                  <div key={m.id} className="text-center text-2xl leading-tight">
                    {m.content}{" "}
                    <span className="align-middle text-[11px] text-netflix-muted">
                      — {m.username}
                    </span>
                  </div>
                );
              }

              const mine = m.user_id === meId;

              const time = new Date(m.created_at).toLocaleTimeString(timeLocale, {
                hour: "2-digit",
                minute: "2-digit",
              });

              const displayName = m.username || t("watchparty.guest");

              return (
                <div key={m.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
                  <Avatar className="mt-0.5 h-6 w-6 shrink-0">
                    <AvatarImage src={m.avatar_url ?? undefined} alt={displayName} />
                    <AvatarFallback className="bg-netflix-red text-[10px] font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn("max-w-[78%]", mine && "text-right")}>
                    <div
                      className={cn(
                        "mb-0.5 flex items-center gap-1.5 text-[10px] text-netflix-muted",
                        mine && "flex-row-reverse",
                      )}
                    >
                      <span className="font-medium">{displayName}</span>
                      <span className="opacity-60">{time}</span>
                    </div>
                    <div
                      className={cn(
                        "inline-block break-words rounded-2xl px-3 py-1.5 text-sm leading-relaxed",
                        mine
                          ? "rounded-tr-sm bg-netflix-red text-white"
                          : "rounded-tl-sm bg-white/10 text-white",
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 overflow-hidden">
          {floats.map((f) => (
            <span
              key={f.id}
              className="absolute bottom-0 text-3xl"
              style={{
                left: `${f.x}%`,
                animation: "floatUp 1.8s ease-out forwards",
              }}
            >
              {f.emoji}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 p-2">
        <div className="mb-1.5 flex gap-0.5">
          {REACTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => react(r)}
              disabled={disabled}
              className="flex-1 rounded py-0.5 text-base transition-transform hover:scale-125 active:scale-95 disabled:opacity-40"
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-1.5">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();

                send();
              }
            }}
            placeholder={disabled ? t("watchparty.loginToChat") : t("watchparty.chatPlaceholder")}
            rows={1}
            disabled={disabled}
            className="min-h-0 flex-1 resize-none border-white/15 bg-black/40 py-2 text-base sm:text-sm text-white placeholder:text-netflix-muted focus-visible:border-netflix-red focus-visible:ring-0 disabled:opacity-50"
          />
          <Button
            type="button"
            size="icon"
            onClick={send}
            disabled={disabled || !text.trim()}
            className="h-9 w-9 shrink-0 bg-netflix-red hover:bg-netflix-red/80 disabled:opacity-40"
            aria-label={t("watchparty.send")}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {text.length > 150 && (
          <p className="mt-1 text-right text-[10px] text-netflix-muted">{text.length}/200</p>
        )}
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1);   opacity: 1; }
          100% { transform: translateY(-140px) scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
