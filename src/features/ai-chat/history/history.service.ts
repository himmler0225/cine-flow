import { aiChatHistoryFn } from "@/features/ai-chat/history/history.functions";

export type ChatSessionMeta = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessageRow = {
  id: string;
  role: string;
  content: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

type AiHistoryEnvelope<T> = { success: boolean; data: T; error?: string };

async function requestChatHistory<T>(
  token: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await aiChatHistoryFn({ data: { token, method, path, body } });
  if (!response.ok) throw new Error("Không tải được lịch sử chat");
  const envelope = response.data as AiHistoryEnvelope<T>;
  if (!envelope?.success) throw new Error(envelope?.error || "Không tải được lịch sử chat");
  return envelope.data;
}

export const aiChatHistory = {
  listSessions: (token: string) =>
    requestChatHistory<ChatSessionMeta[]>(token, "GET", "/history/sessions"),

  upsertSession: (token: string, session: ChatSessionMeta) =>
    requestChatHistory<{ id: string }>(token, "POST", "/history/sessions", session),

  patchSession: (token: string, id: string, title: string) =>
    requestChatHistory<{ id: string }>(token, "PATCH", `/history/sessions/${id}`, { title }),

  deleteSession: (token: string, id: string) =>
    requestChatHistory<{ deleted: string }>(token, "DELETE", `/history/sessions/${id}`),

  getMessages: (token: string, sessionId: string) =>
    requestChatHistory<ChatMessageRow[]>(token, "GET", `/history/sessions/${sessionId}/messages`),

  saveMessages: (token: string, sessionId: string, messages: ChatMessageRow[]) =>
    requestChatHistory<{ saved: number }>(
      token,
      "POST",
      `/history/sessions/${sessionId}/messages`,
      messages,
    ),
};
