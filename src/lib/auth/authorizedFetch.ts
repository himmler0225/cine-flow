import { getAccessToken } from "@/lib/auth/authToken";

/**
 * fetch() for this app's own server routes that require login: sends the in-memory access
 * token and, if it expired, refreshes once and retries (mirrors the axios interceptor).
 */
export async function authorizedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string | null) => {
    const headers = new Headers(init.headers);

    if (token) headers.set("Authorization", `Bearer ${token}`);

    return fetch(input, { ...init, headers });
  };

  const res = await send(getAccessToken());

  if (res.status !== 401) return res;

  const { authApi } = await import("@/services/platform/auth.service");

  const session = await authApi.refreshSession();

  return session?.access_token ? send(session.access_token) : res;
}
