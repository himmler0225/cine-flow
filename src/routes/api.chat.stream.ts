import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { checkRateLimit } from "@/lib/chat/rateLimit";

const MAX_TASK_LENGTH = 2000;
const RATE_LIMIT = { limit: 8, windowMs: 60_000 };

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ message, ...extra }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") || "unknown";
}

// Proxies to ai-layer's POST /ai/agent/run/stream, injecting the shared
// service API key server-side so it never reaches the browser bundle (the
// route only reads AI_LAYER_URL/AI_LAYER_API_KEY from process.env — no
// VITE_ prefix, so Vite never inlines them into client code).
export const Route = createFileRoute("/api/chat/stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const aiLayerUrl = process.env.AI_LAYER_URL;
        const aiLayerApiKey = process.env.AI_LAYER_API_KEY;
        if (!aiLayerUrl || !aiLayerApiKey) {
          console.error("[api/chat/stream] AI_LAYER_URL / AI_LAYER_API_KEY not configured");
          return jsonError(503, "AI chat is not configured on this server.");
        }

        const key = clientKey(request);
        const rate = checkRateLimit(key, RATE_LIMIT.limit, RATE_LIMIT.windowMs);
        if (!rate.ok) {
          return jsonError(429, "Too many messages — please wait a moment.", {
            retryAfterSec: rate.retryAfterSec,
          });
        }

        let body: { task?: unknown; lang?: unknown };
        try {
          body = await request.json();
        } catch {
          return jsonError(400, "Invalid JSON body.");
        }

        const task = typeof body.task === "string" ? body.task.trim() : "";
        if (!task) return jsonError(400, "task is required.");
        if (task.length > MAX_TASK_LENGTH) {
          return jsonError(400, `task must be at most ${MAX_TASK_LENGTH} characters.`);
        }
        const lang = typeof body.lang === "string" && body.lang ? body.lang : "vi";

        let upstream: Response;
        try {
          upstream = await fetch(`${aiLayerUrl.replace(/\/$/, "")}/ai/agent/run/stream`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": aiLayerApiKey,
              "X-Lang": lang,
            },
            body: JSON.stringify({ task, tools: "all" }),
          });
        } catch (err) {
          console.error("[api/chat/stream] upstream request failed", err);
          return jsonError(502, "Could not reach the AI service.");
        }

        if (!upstream.body) {
          return jsonError(502, "AI service returned an empty stream.");
        }

        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
