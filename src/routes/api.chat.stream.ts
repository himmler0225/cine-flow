import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { checkRateLimit } from "@/lib/chat/rateLimit";
import { requireUser } from "@/lib/server/requireUser";

const MAX_TASK_LENGTH = 2000;

const RATE_LIMIT = { limit: 8, windowMs: 60_000 };

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ message, ...extra }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/chat/stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Signed-in (approved) users only; rate-limit per account. The old per-IP key read the
        // client-controlled first X-Forwarded-For entry, so anyone could bypass it.
        const auth = await requireUser(request);

        if (!auth.ok) return jsonError(auth.status, auth.message);

        const aiLayerUrl = process.env.AI_LAYER_URL;

        const aiLayerApiKey = process.env.AI_LAYER_API_KEY;

        if (!aiLayerUrl || !aiLayerApiKey) {
          console.error("[api/chat/stream] AI_LAYER_URL / AI_LAYER_API_KEY not configured");

          return jsonError(503, "AI chat is not configured on this server.");
        }

        const rate = checkRateLimit(`user:${auth.user.id}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs);

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
