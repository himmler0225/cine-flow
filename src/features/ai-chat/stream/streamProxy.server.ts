import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { serverEnv } from "@/config/env.server";
import { buildAgentTask, buildMovieContextSystem } from "@/features/ai-chat/prompt/buildAgentTask";
import { TOOL_STATUS_INPUT_KEY } from "./toolStatus";

type RawAgentEvent = {
  type: "status" | "text_delta" | "tool_start" | "tool_done" | "data_preview" | "done" | "error";
  delta?: string;
  tool?: string;
  detail_vi?: string;
  detail_en?: string;
  message?: string;
  videos?: unknown[];
};

function pickEventDetail(e: Pick<RawAgentEvent, "detail_vi" | "detail_en" | "message">): string {
  return e.detail_vi ?? e.detail_en ?? e.message ?? "";
}

/** Parses `data: {...}` SSE lines (blank-line separated) into JSON events. */
async function* readRawAgentEvents(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<RawAgentEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of rawEvent.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            yield JSON.parse(line.slice(6)) as RawAgentEvent;
          } catch {
            // skip non-JSON lines, keep the stream alive
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

type ChatRequestBody = {
  messages?: UIMessage[];
  movieContext?: { slug: string; name?: string };
};

/** Proxies a chat turn to ai-layer's `/ai/agent/run/stream` and re-emits it as a Vercel AI SDK UIMessageChunk stream. */
export async function handleAiChatStream(request: Request): Promise<Response> {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const task = buildAgentTask(body.messages ?? []);
  if (!task) {
    return new Response(JSON.stringify({ error: "No user message to run" }), { status: 400 });
  }
  const system = buildMovieContextSystem(body.movieContext);

  const aiLayerUrl = serverEnv.AI_LAYER_URL;
  const aiLayerKey = serverEnv.AI_LAYER_KEY;

  // Keep native fetch + Web Streams here (Cloudflare Workers / Nitro). Axios
  // streaming would change the SSE→UIMessageChunk adapter contract.
  let upstream: Response;
  try {
    upstream = await fetch(`${aiLayerUrl}/ai/agent/run/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": aiLayerKey },
      body: JSON.stringify({ task, tools: "all", ...(system ? { system } : {}) }),
      signal: request.signal,
    });
  } catch {
    return new Response(JSON.stringify({ error: "ai-layer is unreachable" }), { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(JSON.stringify({ error: `Agent request failed (${upstream.status})` }), {
      status: 502,
    });
  }

  const rawAgentStream = upstream.body;
  const stream = createUIMessageStream({
    onError: (error) => (error instanceof Error ? error.message : "Agent stream failed"),
    execute: async ({ writer }) => {
      let seq = 0;
      let openTextId: string | null = null;
      const pendingTools: Array<{ id: string; tool: string }> = [];
      const writeUiChunk = (chunk: UIMessageChunk) => writer.write(chunk);
      const closeText = () => {
        if (openTextId) {
          writeUiChunk({ type: "text-end", id: openTextId });
          openTextId = null;
        }
      };

      writeUiChunk({ type: "start" });

      for await (const event of readRawAgentEvents(rawAgentStream)) {
        switch (event.type) {
          case "status": {
            const id = `status-${seq++}`;
            writeUiChunk({ type: "reasoning-start", id });
            writeUiChunk({ type: "reasoning-delta", id, delta: pickEventDetail(event) });
            writeUiChunk({ type: "reasoning-end", id });
            break;
          }
          case "text_delta": {
            if (!event.delta) break;
            if (!openTextId) {
              openTextId = `text-${seq++}`;
              writeUiChunk({ type: "text-start", id: openTextId });
            }
            writeUiChunk({ type: "text-delta", id: openTextId, delta: event.delta });
            break;
          }
          case "tool_start": {
            closeText();
            const toolName = event.tool ?? "tool";
            const id = `call-${seq++}`;
            pendingTools.push({ id, tool: toolName });
            const detail = pickEventDetail(event);
            writeUiChunk({ type: "tool-input-start", toolCallId: id, toolName });
            writeUiChunk({
              type: "tool-input-available",
              toolCallId: id,
              toolName,
              input: detail ? { [TOOL_STATUS_INPUT_KEY]: detail } : {},
            });
            break;
          }
          case "tool_done": {
            const idx = pendingTools.findIndex((p) => p.tool === event.tool);
            const pending = idx === -1 ? pendingTools.shift() : pendingTools.splice(idx, 1)[0];
            if (pending) {
              writeUiChunk({
                type: "tool-output-available",
                toolCallId: pending.id,
                output: { status: "completed" },
              });
            }
            break;
          }
          case "data_preview": {
            writeUiChunk({
              type: `data-video-preview`,
              data: event.videos ?? [],
            } as UIMessageChunk);
            break;
          }
          case "error": {
            closeText();
            writeUiChunk({ type: "error", errorText: pickEventDetail(event) || "Lỗi agent" });
            break;
          }
          case "done": {
            closeText();
            break;
          }
        }
      }

      closeText();
      writeUiChunk({ type: "finish" });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
