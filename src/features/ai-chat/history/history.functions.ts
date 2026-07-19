import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { aiLayerClient } from "@/features/ai-chat/client/aiLayerClient.server";
import { movieApiClient } from "@/lib/http/movieApiClient";

/** Only `/history` and `/history/...` may be proxied with the server AI key. */
function isAllowedHistoryPath(path: string): boolean {
  if (path.includes("..") || path.includes("//") || path.includes("\\")) return false;
  return path === "/history" || path.startsWith("/history/");
}

const InputSchema = z.object({
  token: z.string().min(1),
  method: z.enum(["GET", "POST", "PATCH", "DELETE"]),
  path: z
    .string()
    .min(1)
    .refine(isAllowedHistoryPath, { message: "Path must be under /history" }),
  body: z.unknown().optional(),
});

/**
 * Proxies chat-history CRUD to ai-layer's `/ai/history/*`.
 *
 * ai-layer resolves the caller's identity either via a Supabase bearer token
 * or a trusted `X-User-Id` header (only usable by holders of `AI_LAYER_KEY`).
 * cine-flow's own access_token isn't a Supabase token, so instead of forwarding
 * it, we verify it ourselves against movie-aggregator-api's `/api/auth/session`
 * (same check the app already trusts everywhere else) and forward the
 * *verified* user id — never a client-supplied one.
 */
export const aiChatHistoryFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const sessionRes = await movieApiClient.get<{ user?: { id?: string } }>("/api/auth/session", {
      headers: { Authorization: `Bearer ${data.token}` },
      validateStatus: () => true,
    });
    if (sessionRes.status < 200 || sessionRes.status >= 300) {
      return { ok: false, status: 401, data: { error: "Invalid session" } };
    }
    const userId = sessionRes.data?.user?.id;
    if (!userId) {
      return { ok: false, status: 401, data: { error: "Invalid session" } };
    }

    const response = await aiLayerClient.request({
      url: `/ai${data.path}`,
      method: data.method,
      data: data.body,
      headers: { "X-User-Id": userId },
      validateStatus: () => true,
    });
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data ?? null,
    };
  });
