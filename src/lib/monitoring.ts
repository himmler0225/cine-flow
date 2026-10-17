type SentryModule = typeof import("@sentry/browser");

const DSN = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim();

let sentry: Promise<SentryModule | null> | null = null;

/**
 * Error tracking is opt-in: the SDK is only downloaded when VITE_SENTRY_DSN is
 * set at build time, and only in the browser. Without it every call is a no-op.
 */
export function initMonitoring() {
  if (!DSN || typeof window === "undefined" || sentry) return;

  sentry = import("@sentry/browser")
    .then((Sentry) => {
      Sentry.init({
        dsn: DSN,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION as string | undefined,
        tracesSampleRate: 0,
        // Browser extensions and cross-origin player embeds are not ours to fix.
        ignoreErrors: ["ResizeObserver loop", "Non-Error promise rejection captured"],
        denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-extension:\/\//],
      });

      return Sentry;
    })
    .catch(() => null);
}

export function reportError(error: unknown, context?: Record<string, string>) {
  if (!sentry) return;

  void sentry.then((Sentry) => {
    if (!Sentry) return;

    Sentry.withScope((scope) => {
      if (context) scope.setTags(context);

      Sentry.captureException(error);
    });
  });
}

export function setMonitoringUser(userId: string | null) {
  if (!sentry) return;

  void sentry.then((Sentry) => Sentry?.setUser(userId ? { id: userId } : null));
}
