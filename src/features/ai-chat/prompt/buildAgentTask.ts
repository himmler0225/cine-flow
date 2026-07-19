import type { UIMessage } from "ai";

const HISTORY_BLOCK = "[Lịch sử hội thoại]\n";
const HISTORY_MARKER = "\n[Câu hỏi hiện tại]\n";
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 1_200;

function messageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function clip(text: string, max = MAX_MESSAGE_CHARS): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

/** Turns the message history into a single task string for ai-layer's agent (last user message = "current question"). */
export function buildAgentTask(messages: UIMessage[]): string {
  const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
  if (lastUserIdx === -1) return "";

  const lastUser = messages[messages.length - 1 - lastUserIdx];
  const current = messageText(lastUser);
  if (!current) return "";

  const prior = messages.slice(0, messages.length - 1 - lastUserIdx).slice(-MAX_HISTORY_MESSAGES);
  const lines = prior
    .map((m) => {
      const text = messageText(m);
      return text ? `${m.role === "user" ? "User" : "Assistant"}: ${clip(text)}` : null;
    })
    .filter((l): l is string => !!l);

  if (lines.length === 0) return current;
  return `${HISTORY_BLOCK}${lines.join("\n\n")}${HISTORY_MARKER}${current}`;
}

/**
 * Movie context goes in ai-layer's `system` field, not prefixed into `task` —
 * prefixing confuses the agent's intent/slot-filling prompt (verified by hand:
 * it starts leaking raw `intent=..., print(tool(...))` scratchpad text instead
 * of answering) and never invokes tools.
 *
 * `name` is optional — when the assistant only has a route slug, the agent can
 * look the title up via tools.
 */
export function buildMovieContextSystem(ctx?: { slug: string; name?: string }): string | undefined {
  if (!ctx?.slug) return undefined;
  if (ctx.name?.trim()) {
    return `Bối cảnh: user đang xem/đang ở trang phim "${ctx.name.trim()}" (slug: ${ctx.slug}).`;
  }
  return `Bối cảnh: user đang xem/đang ở trang phim với slug "${ctx.slug}".`;
}
