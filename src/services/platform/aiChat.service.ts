import { platformFetch } from "@/lib/platformApi";
import type { AiConversation, AiChatMessageRecord } from "@/types/chat";

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class AiChatApi {
  listConversations(page = 1, limit = 24): Promise<PaginatedResult<AiConversation>> {
    return platformFetch<PaginatedResult<AiConversation>>(
      `/api/ai-chat/conversations?page=${page}&limit=${limit}`,
    );
  }
  createConversation(): Promise<AiConversation> {
    return platformFetch<AiConversation>("/api/ai-chat/conversations", { method: "POST" });
  }
  listMessages(conversationId: string): Promise<AiChatMessageRecord[]> {
    return platformFetch<AiChatMessageRecord[]>(
      `/api/ai-chat/conversations/${conversationId}/messages`,
    );
  }
  appendMessage(
    conversationId: string,
    body: {
      role: "user" | "assistant";
      content: string;
      actions?: unknown[];
      videos?: unknown[];
    },
  ): Promise<AiChatMessageRecord> {
    return platformFetch<AiChatMessageRecord>(
      `/api/ai-chat/conversations/${conversationId}/messages`,
      { method: "POST", body: JSON.stringify(body) },
    );
  }
  deleteConversation(conversationId: string): Promise<void> {
    return platformFetch(`/api/ai-chat/conversations/${conversationId}`, { method: "DELETE" });
  }
}

export const aiChatApi = new AiChatApi();
