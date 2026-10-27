import { PlatformApiError, platformFetch } from "@/lib/platformApi";
import {
  applySessionTokens,
  clearAuthTokens,
  clearLegacyAuthStorage,
  getLegacyRefreshToken,
} from "@/lib/auth/authToken";
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
const REFRESH_RETRY_DELAYS_MS = [500, 1500, 4000];

/** Tells other tabs to drop their in-memory session after a sign-out. */
const AUTH_CHANNEL = "cineflow-auth";

/** The server looked at the refresh token and refused it (vs. network / 5xx / 429). */
function isRefreshRejected(error: unknown): boolean {
  return error instanceof PlatformApiError && [400, 401, 403].includes(error.status);
}

/**
 * The refresh cookie rotates on every use and is shared by all tabs: refresh one tab at a
 * time so the browser always ends up holding the newest cookie.
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
  private channel: BroadcastChannel | null = null;
  private getChannel(): BroadcastChannel | null {
    if (this.channel || typeof BroadcastChannel === "undefined") return this.channel;

    this.channel = new BroadcastChannel(AUTH_CHANNEL);

    this.channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type !== "signed-out") return;

      clearAuthTokens();

      this.emitAuthChange("SIGNED_OUT", null);
    };

    return this.channel;
  }
  /** Starts listening for sign-outs made in other tabs. */
  listenAcrossTabs(): void {
    this.getChannel();
  }
  async refreshSession(): Promise<Session | null> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = withRefreshLock(() => this.rotateRefreshToken()).finally(() => {
      refreshInFlight = null;
    });

    return refreshInFlight;
  }
  private async rotateRefreshToken(): Promise<Session | null> {
    let transientFailures = 0;

    for (;;) {
      // Read inside the lock and on every attempt: another tab may have upgraded it already.
      const legacyToken = getLegacyRefreshToken();

      try {
        const session = await platformFetch<Session>("/api/auth/refresh", {
          method: "POST",
          body: JSON.stringify(legacyToken ? { refresh_token: legacyToken } : {}),
          auth: false,
        });

        // The API now holds the session in its httpOnly cookie.
        clearLegacyAuthStorage();

        applySessionTokens(session);

        return session;
      } catch (error) {
        if (isRefreshRejected(error)) {
          clearAuthTokens();

          this.emitAuthChange("SIGNED_OUT", null);

          return null;
        }

        // Network error / 5xx / 429 (e.g. during a deploy): the cookie is untouched; retry.
        if (transientFailures >= REFRESH_RETRY_DELAYS_MS.length) throw error;

        await sleep(REFRESH_RETRY_DELAYS_MS[transientFailures]);

        transientFailures += 1;
      }
    }
  }
  /**
   * Restores the session from the refresh cookie. Returns null when signed out; throws
   * when the API is unreachable, so callers don't mistake an outage for a sign-out.
   */
  async getSession(): Promise<Session | null> {
    return this.refreshSession();
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
    const legacyToken = getLegacyRefreshToken();

    try {
      await platformFetch("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify(legacyToken ? { refresh_token: legacyToken } : {}),
        auth: false,
      });
    } catch {}

    clearAuthTokens();

    this.getChannel()?.postMessage({ type: "signed-out" });

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
