import { create } from "zustand";
import { streamChat } from "@/lib/chat/streamChat";
import type { ChatMessage, ChatToolAction } from "@/types/chat";

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  reset: () => void;
  sendMessage: (task: string, lang: string) => Promise<void>;
  stop: () => void;
}

let abortController: AbortController | null = null;

export const useChatStore = create<ChatState>()((set, get) => ({
  isOpen: false,
  messages: [],
  isStreaming: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  reset: () => {
    abortController?.abort();
    set({ messages: [], isStreaming: false });
  },
  stop: () => {
    abortController?.abort();
    set({ isStreaming: false });
    updateMessage(
      set,
      (m) => m.status === "streaming",
      (m) => ({ ...m, status: "done" }),
    );
  },

  sendMessage: async (task: string, lang: string) => {
    const trimmed = task.trim();
    if (!trimmed || get().isStreaming) return;

    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      text: trimmed,
      actions: [],
      videos: [],
      status: "done",
      createdAt: Date.now(),
    };
    const assistantId = newId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      actions: [],
      videos: [],
      status: "pending",
      createdAt: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, userMessage, assistantMessage], isStreaming: true }));

    abortController = new AbortController();
    let toolSeq = 0;

    try {
      for await (const event of streamChat({
        task: trimmed,
        lang,
        signal: abortController.signal,
      })) {
        switch (event.type) {
          case "status": {
            const action: ChatToolAction = {
              id: `status-${toolSeq++}`,
              tool: "_status",
              detail: event.detail,
              status: "done",
            };
            patchAssistant(set, assistantId, (m) => ({
              ...m,
              status: "streaming",
              actions: [...m.actions, action],
            }));
            break;
          }
          case "tool_start": {
            const action: ChatToolAction = {
              id: `${event.tool}-${toolSeq++}`,
              tool: event.tool,
              detail: event.detail,
              status: "running",
            };
            patchAssistant(set, assistantId, (m) => ({
              ...m,
              status: "streaming",
              actions: [...m.actions, action],
            }));
            break;
          }
          case "tool_done": {
            patchAssistant(set, assistantId, (m) => {
              const idx = m.actions.findIndex(
                (a) => a.tool === event.tool && a.status === "running",
              );
              if (idx === -1) return m;
              const actions = [...m.actions];
              actions[idx] = { ...actions[idx]!, status: "done" };
              return { ...m, actions };
            });
            break;
          }
          case "text_delta": {
            patchAssistant(set, assistantId, (m) => ({
              ...m,
              status: "streaming",
              text: m.text + event.delta,
            }));
            break;
          }
          case "data_preview": {
            patchAssistant(set, assistantId, (m) => ({
              ...m,
              videos: mergeVideos(m.videos, event.videos),
            }));
            break;
          }
          case "done": {
            patchAssistant(set, assistantId, (m) => ({
              ...m,
              status: "done",
              videos: mergeVideos(m.videos, event.data.videos ?? []),
            }));
            break;
          }
          case "error": {
            patchAssistant(set, assistantId, (m) => ({
              ...m,
              status: "error",
              errorMessage: event.message || event.detail,
            }));
            break;
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        patchAssistant(set, assistantId, (m) => ({
          ...m,
          status: "error",
          errorMessage: err instanceof Error ? err.message : "Connection lost.",
        }));
      }
    } finally {
      abortController = null;
      set({ isStreaming: false });
    }
  },
}));

function patchAssistant(
  set: (fn: (s: ChatState) => Partial<ChatState>) => void,
  id: string,
  patch: (m: ChatMessage) => ChatMessage,
) {
  set((s) => ({
    messages: s.messages.map((m) => (m.id === id ? patch(m) : m)),
  }));
}

function updateMessage(
  set: (fn: (s: ChatState) => Partial<ChatState>) => void,
  match: (m: ChatMessage) => boolean,
  patch: (m: ChatMessage) => ChatMessage,
) {
  set((s) => ({ messages: s.messages.map((m) => (match(m) ? patch(m) : m)) }));
}

function mergeVideos(
  existing: ChatMessage["videos"],
  incoming: ChatMessage["videos"],
): ChatMessage["videos"] {
  if (!incoming?.length) return existing;
  const seen = new Set(existing.map((v) => v.video_id).filter(Boolean));
  const added = incoming.filter((v) => v.video_id && !seen.has(v.video_id));
  return added.length ? [...existing, ...added] : existing;
}
