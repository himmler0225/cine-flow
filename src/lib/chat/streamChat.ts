import type { AgentSSEEvent } from "@/types/chat";

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.clone().json()) as { message?: string; error?: string };

    return data.message || data.error || fallback;
  } catch {
    try {
      const text = await res.text();

      return text || fallback;
    } catch {
      return fallback;
    }
  }
}

interface StreamChatParams {
  task: string;
  lang: string;
  signal?: AbortSignal;
}

export async function* streamChat({
  task,
  lang,
  signal,
}: StreamChatParams): AsyncGenerator<AgentSSEEvent> {
  const res = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, lang }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(await readErrorMessage(res, `Chat request failed (${res.status})`));
  }

  const reader = res.body.getReader();

  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");

    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));

      if (!dataLine) continue;

      const json = dataLine.slice("data:".length).trim();

      if (!json) continue;

      try {
        yield JSON.parse(json) as AgentSSEEvent;
      } catch {}
    }
  }
}
