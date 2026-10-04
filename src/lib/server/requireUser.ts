import { MOVIE_API_BASE_URL } from "@/lib/movie/movieApi";
import { isAdminRole } from "@/constants/roles";

export type ServerRouteUser = {
  id: string;
  role?: string | null;
};

export type RequireUserResult =
  | { ok: true; user: ServerRouteUser }
  | { ok: false; status: 401 | 403 | 502 | 503; message: string };

/**
 * Auth for this app's own server routes (/api/chat/stream, /api/admin/ai-config). They call
 * the AI layer with a service key, so they must not be open to anonymous callers. The bearer
 * token is checked by the API itself (signature, expiry, admin-approval gate) via
 * /api/profiles/me, which also returns the role.
 */
export async function requireUser(
  request: Request,
  opts: { admin?: boolean } = {},
): Promise<RequireUserResult> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  let res: Response;

  try {
    res = await fetch(`${MOVIE_API_BASE_URL}/api/profiles/me`, {
      headers: { authorization, accept: "application/json" },
    });
  } catch (err) {
    console.error("[requireUser] API unreachable", err);

    return { ok: false, status: 503, message: "Auth service unavailable." };
  }

  if (res.status === 401 || res.status === 403) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  if (!res.ok) return { ok: false, status: 502, message: "Auth check failed." };

  const user = (await res.json().catch(() => null)) as ServerRouteUser | null;

  if (!user?.id) return { ok: false, status: 401, message: "Unauthorized" };

  if (opts.admin && !isAdminRole(user.role)) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true, user };
}
