export type AgentSSEEvent =
  | { type: "status"; detail: string }
  | { type: "tool_start"; tool: string; detail: string; args: unknown; worker?: string }
  | { type: "tool_done"; tool: string; worker?: string }
  | { type: "text_delta"; delta: string }
  | { type: "data_preview"; videos: ChatVideoPreview[]; worker?: string }
  | { type: "done"; data: ChatDoneData; tool_calls: unknown[] }
  | { type: "error"; detail: string; message: string; message_key?: string };

export interface ChatVideoPreview {
  video_id?: string;
  url?: string;
  title?: string;
  channel?: string;
  thumbnails?: { url: string; width?: number; height?: number }[];
  desc?: string;
  cover?: string;
  author?: { nickname?: string; unique_id?: string };
  [key: string]: unknown;
}

export interface ChatDoneData {
  review_summary: string | null;
  sources: unknown[];
  videos: ChatVideoPreview[];
  reviews_analyzed: number;
  review_source: string | null;
}

export interface ChatToolAction {
  id: string;
  tool: string;
  detail: string;
  status: "running" | "done";
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  actions: ChatToolAction[];
  videos: ChatVideoPreview[];
  status: "pending" | "streaming" | "done" | "error";
  errorMessage?: string;
  createdAt: number;
}

export interface AiConversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiChatMessageRecord {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  actions: ChatToolAction[] | null;
  videos: ChatVideoPreview[] | null;
  created_at: string;
}
