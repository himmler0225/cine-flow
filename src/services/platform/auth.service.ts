import { PlatformApiError, platformFetch } from "@/lib/platformApi";
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

const REFRESH_LOCK_NAME = "cineflow-auth-refresh";

/** Backoff between retries when the refresh call fails for a non-auth reason. */
const REFRESH_RETRY_DELAYS_MS = [500, 1500];

/** The server looked at the refresh token and refused it (vs. network / 5xx / 429). */
function isRefreshRejected(error: unknown): boolean {
  return error instanceof PlatformApiError && [400, 401, 403].includes(error.status);
}

/**
 * Refresh tokens rotate on every use and live in localStorage shared by all tabs. Without a
 * cross-tab lock, two tabs (e.g. Safari restoring several at once) refreshed with the same
 * token: the slower one got 401 and then deleted the token the faster one had just stored,
 * logging every tab out.
 */
function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;

  if (!locks?.request) return fn();

  return locks.request(REFRESH_LOCK_NAME, fn) as Promise<T>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    refreshInFlight = withRefreshLock(() => this.rotateRefreshToken()).finally(() => {
      refreshInFlight = null;
    });

    return refreshInFlight;
  }
  private async rotateRefreshToken(): Promise<Session | null> {
    // Read inside the lock: another tab may have rotated the token while we waited.
    let refreshToken = getRefreshToken();

    let transientFailures = 0;

    while (refreshToken) {
      try {
        const session = await platformFetch<Session>("/api/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
          auth: false,
        });

        applySessionTokens(session);

        return session;
      } catch (error) {
        if (isRefreshRejected(error)) {
          const latest = getRefreshToken();

          // Replaced meanwhile (a tab without Web Locks): retry with the newer token.
          if (latest && latest !== refreshToken) {
            refreshToken = latest;

            continue;
          }

          clearAuthTokens();

          this.emitAuthChange("SIGNED_OUT", null);

          return null;
        }

        // Network error / 5xx / 429 (e.g. during a deploy): keep the token, retry briefly.
        if (transientFailures >= REFRESH_RETRY_DELAYS_MS.length) return null;

        await sleep(REFRESH_RETRY_DELAYS_MS[transientFailures]);

        transientFailures += 1;
      }
    }

    return null;
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
    } catch (error) {
      if (isRefreshRejected(error)) clearAuthTokens();

      return null;
    }
  }
  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<
    AuthResult<{
      user: User;
      session: Session;
    }>
  > {
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
    await platformFetch<{
      pending: true;
    }>("/api/auth/register", {
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
    } catch {}

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
