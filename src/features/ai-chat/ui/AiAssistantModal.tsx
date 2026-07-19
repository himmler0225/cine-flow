import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMatches } from "@tanstack/react-router";
import { Send, CopyIcon, RefreshCcwIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { getAccessToken } from "@/lib/auth/authToken";
import { aiChatHistory, type ChatMessageRow } from "@/features/ai-chat/history/history.service";
import {
  Conversation,
  ConversationContent,
} from "@/features/ai-chat/ui/chat-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/features/ai-chat/ui/chat-elements/message";
import { Reasoning } from "@/features/ai-chat/ui/chat-elements/reasoning";
import { Tool } from "@/features/ai-chat/ui/chat-elements/tool";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/features/ai-chat/ui/chat-elements/sources";
import { Loader } from "@/features/ai-chat/ui/chat-elements/loader";

const MOVIE_ROUTE_IDS = new Set(["/movie/$slug", "/watch/$slug"]);

function useMovieRouteSlug(): string | null {
  const matches = useMatches();
  for (const match of matches) {
    if (!MOVIE_ROUTE_IDS.has(match.routeId)) continue;
    const slug = (match.params as { slug?: string }).slug;
    if (slug) return slug;
  }
  return null;
}

function messageText(m: UIMessage): string {
  return m.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

function toRow(m: UIMessage): ChatMessageRow {
  return {
    id: m.id,
    role: m.role,
    content: messageText(m),
    metadata: { parts: m.parts },
    created_at: new Date().toISOString(),
  };
}

function fromRow(r: ChatMessageRow): UIMessage {
  const parts = (r.metadata?.parts as UIMessage["parts"]) ?? [{ type: "text", text: r.content }];
  return { id: r.id, role: r.role as UIMessage["role"], parts } as UIMessage;
}

export function AiAssistantModal() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const movieSlug = useMovieRouteSlug();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loadedHistory, setLoadedHistory] = useState(!isAuthenticated);
  const savedCountRef = useRef(0);

  // Load the user's most recent ongoing conversation once, on first open.
  useEffect(() => {
    if (!open || loadedHistory || !isAuthenticated) return;
    const token = getAccessToken();
    if (!token) {
      setLoadedHistory(true);
      return;
    }
    (async () => {
      try {
        const sessions = await aiChatHistory.listSessions(token);
        const latest = sessions[0];
        if (latest) {
          const rows = await aiChatHistory.getMessages(token, latest.id);
          setSessionId(latest.id);
          setInitialMessages(rows.map(fromRow));
          savedCountRef.current = rows.length;
        }
      } catch {
        /* start empty on failure — chat still works, just not restored */
      } finally {
        setLoadedHistory(true);
      }
    })();
  }, [open, loadedHistory, isAuthenticated]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai-chat/stream",
        body: () => (movieSlug ? { movieContext: { slug: movieSlug } } : {}),
      }),
    [movieSlug],
  );

  const { messages, sendMessage, status, regenerate, error } = useChat({
    messages: initialMessages,
    transport,
    onFinish: async ({ messages: allMessages }) => {
      if (!isAuthenticated) return;
      const token = getAccessToken();
      if (!token) return;
      try {
        let sid = sessionId;
        if (!sid) {
          sid = crypto.randomUUID();
          const firstUserText = messageText(
            allMessages.find((m) => m.role === "user") ?? allMessages[0],
          );
          const title = firstUserText.slice(0, 48) || "Cuộc trò chuyện mới";
          const now = new Date().toISOString();
          await aiChatHistory.upsertSession(token, {
            id: sid,
            title,
            created_at: now,
            updated_at: now,
          });
          setSessionId(sid);
        }
        const toSave = allMessages.slice(savedCountRef.current).map(toRow);
        if (toSave.length > 0) {
          await aiChatHistory.saveMessages(token, sid, toSave);
          savedCountRef.current = allMessages.length;
        }
      } catch {
        /* history sync failing shouldn't break the live chat */
      }
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group fixed bottom-24 right-5 z-[55] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red focus-visible:ring-offset-2 focus-visible:ring-offset-netflix-black lg:bottom-6"
        aria-label="Mở trợ lý AI"
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-netflix-red/35 blur-lg transition-colors group-hover:bg-netflix-red/60"
        />
        <img
          src="/ai-assistant.png"
          alt=""
          width={56}
          height={56}
          className="relative h-14 w-14 rounded-full shadow-xl shadow-black/50 ring-2 ring-netflix-red/60 transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
        />
        <span
          aria-hidden
          className="absolute right-0 top-0 h-3 w-3 animate-pulse rounded-full bg-netflix-red ring-2 ring-netflix-black"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[min(85vh,680px)] w-[calc(100%-1.5rem)] max-w-xl flex-col gap-0 overflow-hidden border-white/10 bg-[#141414] p-0 text-white shadow-2xl shadow-black/60 sm:rounded-xl">
          <DialogHeader className="shrink-0 space-y-1 border-b border-white/10 px-4 py-3.5 pr-12 text-left sm:text-left">
            <DialogTitle className="flex items-center gap-2.5 text-base font-semibold text-white">
              <img
                src="/ai-assistant.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full ring-1 ring-netflix-red/50"
              />
              Trợ lý AI
            </DialogTitle>
            <DialogDescription className="text-xs text-white/45">
              {movieSlug
                ? `Đang gắn ngữ cảnh phim · ${movieSlug}`
                : "Gợi ý phim, tìm kiếm, hỏi đáp — sẵn sàng mọi lúc"}
            </DialogDescription>
          </DialogHeader>

          <Conversation autoScrollKey={`${messages.length}-${messages.at(-1)?.parts.length ?? 0}`}>
            <ConversationContent className="px-4">
              {messages.length === 0 && (
                <div className="mt-8 space-y-3 text-center">
                  <div className="relative mx-auto h-20 w-20">
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-netflix-red/25 blur-xl"
                    />
                    <img
                      src="/ai-assistant.png"
                      alt=""
                      width={80}
                      height={80}
                      className="relative h-20 w-20 rounded-full ring-1 ring-netflix-red/40"
                    />
                  </div>
                  <p className="text-sm text-white/50">
                    {movieSlug
                      ? "Hỏi mình về phim này — review, diễn viên, cảnh hay, gợi ý tương tự…"
                      : "Hỏi mình bất cứ điều gì — gợi ý phim theo tâm trạng, tìm theo thể loại, so sánh…"}
                  </p>
                  <p className="text-[11px] text-white/30">
                    Nhấn Enter để gửi · Shift+Enter xuống dòng
                  </p>
                </div>
              )}
              {messages.map((message) => {
                const sourceParts = message.parts.filter((p) => p.type === "source-url");
                return (
                  <div key={message.id} className="flex flex-col gap-2">
                    {message.role === "assistant" && sourceParts.length > 0 && (
                      <Sources>
                        <SourcesTrigger count={sourceParts.length} />
                        <SourcesContent>
                          {sourceParts.map((p, i) => (
                            <Source
                              key={i}
                              href={(p as { url: string }).url}
                              title={(p as { url: string }).url}
                            />
                          ))}
                        </SourcesContent>
                      </Sources>
                    )}
                    {message.parts.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <Message key={i} from={message.role === "user" ? "user" : "assistant"}>
                            <MessageContent>
                              <MessageResponse>{part.text}</MessageResponse>
                            </MessageContent>
                            {message.role === "assistant" && i === message.parts.length - 1 && (
                              <MessageActions>
                                <MessageAction onClick={() => regenerate()} label="Thử lại">
                                  <RefreshCcwIcon className="h-3 w-3" />
                                </MessageAction>
                                <MessageAction
                                  onClick={() => void navigator.clipboard.writeText(part.text)}
                                  label="Sao chép"
                                >
                                  <CopyIcon className="h-3 w-3" />
                                </MessageAction>
                              </MessageActions>
                            )}
                          </Message>
                        );
                      }
                      if (part.type === "reasoning") {
                        return (
                          <Reasoning
                            key={i}
                            isStreaming={isStreaming && i === message.parts.length - 1}
                          >
                            {part.text}
                          </Reasoning>
                        );
                      }
                      if (part.type.startsWith("tool-")) {
                        const tp = part as {
                          state: string;
                          input: unknown;
                          output?: unknown;
                          errorText?: string;
                        };
                        return (
                          <Tool
                            key={i}
                            toolName={part.type.slice(5)}
                            state={tp.state as never}
                            input={tp.input}
                            output={tp.output}
                            errorText={tp.errorText}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                );
              })}
              {status === "submitted" && (
                <Message from="assistant">
                  <MessageContent>
                    <Loader />
                  </MessageContent>
                </Message>
              )}
              {error && (
                <p className="px-1 text-xs text-red-400">{error.message || "Đã có lỗi xảy ra"}</p>
              )}
            </ConversationContent>
          </Conversation>

          <div className="shrink-0 border-t border-white/10 bg-black/30 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={movieSlug ? "Hỏi về phim này…" : "Bạn muốn xem gì hôm nay?"}
                className="min-h-10 resize-none border-white/10 bg-white/5 text-sm text-white placeholder:text-white/35"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                size="icon"
                className="h-10 w-10 shrink-0 bg-netflix-red hover:bg-netflix-red-hover disabled:opacity-40"
                aria-label="Gửi"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
