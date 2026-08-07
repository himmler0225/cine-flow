import { platformFetch } from "@/lib/platformApi";
import {
  applySessionTokens,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "@/lib/auth/authToken";
import { readStorageKey } from "@/constants/storage";
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
  refresh_token?: string;
  user: ApiUser;
}

export type User = ApiUser;

export type Session = ApiSession;

type AuthError = {
  message: string;
  code?: string;
};

type AuthResult<T> = {
  data: T;
  error: AuthError | null;
};

type AuthActionResult = {
  error: AuthError | null;
};

type AuthCallback = (event: string, session: Session | null) => void;

let refreshInFlight: Promise<Session | null> | null = null;

class AuthApi {
  private readonly listeners = new Set<AuthCallback>();

  private emitAuthChange(event: string, session: Session | null) {
    for (const cb of this.listeners) cb(event, session);
  }

  onAuthStateChange(callback: AuthCallback) {
    this.listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          },
        },
      },
    };
  }

  private hydrateLegacyAccessToken(): void {
    if (getAccessToken()) return;
    const legacy = readStorageKey("accessToken");
    if (legacy) setAccessToken(legacy);
  }

  async refreshSession(): Promise<Session | null> {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;
      try {
        const session = await platformFetch<Session>("/api/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
          auth: false,
        });
        applySessionTokens(session);
        return session;
      } catch {
        clearAuthTokens();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  }

  async getSession(): Promise<Session | null> {
    this.hydrateLegacyAccessToken();
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshed = await this.refreshSession();
      if (refreshed) return refreshed;
    }

    const token = getAccessToken();
    if (!token) return null;

    try {
      const issueRefresh = !getRefreshToken();
      const path = issueRefresh ? "/api/auth/session?issue_refresh=1" : "/api/auth/session";
      const session = await platformFetch<Session>(path);
      applySessionTokens(session);
      return session;
    } catch {
      clearAuthTokens();
      return null;
    }
  }

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<AuthResult<{ user: User; session: Session }>> {
    const session = await platformFetch<Session>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    });
    applySessionTokens(session);
    this.emitAuthChange("SIGNED_IN", session);
    return { data: { user: session.user, session }, error: null };
  }

  async signUp(email: string, password: string, username: string): Promise<AuthActionResult> {
    await platformFetch<{ pending: true }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
      auth: false,
    });
    return { error: null };
  }

  async signInWithGoogle(): Promise<AuthResult<null>> {
    if (typeof window === "undefined") {
      return {
        data: null,
        error: { message: "OAuth chỉ khả dụng trên trình duyệt." },
      };
    }
    const redirectUri = `${window.location.origin}/auth/callback`;
    window.location.href = `${MOVIE_API_BASE_URL}/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
    return { data: null, error: null };
  }

  async signOut(): Promise<AuthActionResult> {
    const refreshToken = getRefreshToken();
    try {
      await platformFetch("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
      });
    } catch {
      /* server-side logout is best-effort — local session is always cleared below regardless */
    }
    clearAuthTokens();
    this.emitAuthChange("SIGNED_OUT", null);
    return { error: null };
  }

  async resetPasswordForEmail(email: string): Promise<AuthActionResult> {
    await platformFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      auth: false,
    });
    return { error: null };
  }

  async updateUserPassword(password: string): Promise<AuthActionResult> {
    await platformFetch("/api/auth/update-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    return { error: null };
  }
}

export const authApi = new AuthApi();
