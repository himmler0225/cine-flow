import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireUser } from "@/lib/server/requireUser";

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function proxy(request: Request, method: "GET" | "PATCH"): Promise<Response> {
  // Reads and rewrites the AI layer's admin config with the service key: admins only.
  const auth = await requireUser(request, { admin: true });

  if (!auth.ok) return jsonError(auth.status, auth.message);

  const aiLayerUrl = process.env.AI_LAYER_URL;

  const aiLayerApiKey = process.env.AI_LAYER_API_KEY;

  if (!aiLayerUrl || !aiLayerApiKey) {
    console.error("[api/admin/ai-config] AI_LAYER_URL / AI_LAYER_API_KEY not configured");

    return jsonError(503, "AI config admin is not configured on this server.");
  }

  let upstream: Response;

  try {
    upstream = await fetch(`${aiLayerUrl.replace(/\/$/, "")}/ai/auth/admin/config`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": aiLayerApiKey,
      },
      body: method === "PATCH" ? await request.text() : undefined,
    });
  } catch (err) {
    console.error("[api/admin/ai-config] upstream request failed", err);

    return jsonError(502, "Could not reach the AI service.");
  }

  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/admin/ai-config")({
  server: {
    handlers: {
      GET: async ({ request }) => proxy(request, "GET"),
      PATCH: async ({ request }) => proxy(request, "PATCH"),
    },
  },
});
