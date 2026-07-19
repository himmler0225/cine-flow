import { platformFetch } from "@/lib/platformApi";
import { getAccessToken, setAccessToken } from "@/lib/auth/authToken";
import { MOVIE_API_BASE_URL } from "@/lib/movie/movieApi";

export interface ApiUser {
  id: string;
  email: string;
  created_at?: string;
  user_metadata: Record<string, unknown>;
}

export interface ApiSession {
  access_token: string;
  expires_at: number;
  user: ApiUser;
}

export type User = ApiUser;
export type Session = ApiSession;
type AuthError = { message: string; code?: string };
type AuthResult<T> = { data: T; error: AuthError | null };
type AuthActionResult = { error: AuthError | null };

type AuthCallback = (event: string, session: Session | null) => void;
const listeners = new Set<AuthCallback>();

function emitAuthChange(event: string, session: Session | null) {
  for (const cb of listeners) cb(event, session);
}

export async function getSession(): Promise<Session | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const session = await platformFetch<Session>("/api/auth/session");
    setAccessToken(session.access_token);
    return session;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export function onAuthStateChange(callback: AuthCallback) {
  listeners.add(callback);
  return {
    data: {
      subscription: {
        unsubscribe: () => {
          listeners.delete(callback);
        },
      },
    },
  };
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthResult<{ user: User; session: Session }>> {
  const session = await platformFetch<Session>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
  });
  setAccessToken(session.access_token);
  emitAuthChange("SIGNED_IN", session);
  return { data: { user: session.user, session }, error: null };
}

export async function signUp(
  email: string,
  password: string,
  username: string,
): Promise<AuthResult<{ user: User; session: Session }>> {
  const session = await platformFetch<Session>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, username }),
    auth: false,
  });
  setAccessToken(session.access_token);
  emitAuthChange("SIGNED_IN", session);
  return { data: { user: session.user, session }, error: null };
}

export async function signInWithGoogle(): Promise<AuthResult<null>> {
  if (typeof window === "undefined") {
    return { data: null, error: { message: "OAuth chỉ khả dụng trên trình duyệt." } };
  }
  const redirectUri = `${window.location.origin}/auth/callback`;
  window.location.href = `${MOVIE_API_BASE_URL}/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
  return { data: null, error: null };
}

export async function signOut(): Promise<AuthActionResult> {
  try {
    await platformFetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
  setAccessToken(null);
  emitAuthChange("SIGNED_OUT", null);
  return { error: null };
}

export async function resetPasswordForEmail(email: string): Promise<AuthActionResult> {
  await platformFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    auth: false,
  });
  return { error: null };
}

export async function updateUserPassword(password: string): Promise<AuthActionResult> {
  await platformFetch("/api/auth/update-password", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  return { error: null };
}
