import { Suspense, lazy, useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import {
  Outlet,
  Link,
  Navigate,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useLocation,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TopProgress } from "@/components/layout/TopProgress";
import { ContinueWatchingBar } from "@/components/movie/ContinueWatchingBar";
import { ChatTriggerButton } from "@/components/chat/ChatTriggerButton";
import { useWatchlistSync } from "@/hooks/useWatchlistSync";
import { I18nProvider } from "@/components/common/I18nProvider";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { registerAuthNavigator } from "@/lib/auth/authNavigation";
import { buildLoginRedirect, isPublicAuthPath, isPublicPath } from "@/lib/auth/authRoutes";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { serializeJsonLd } from "@/lib/seo/jsonLd";
import i18n, { t } from "@/lib/i18n";
import { EXTERNAL_URLS, MOVIE_IMAGE_ORIGINS } from "@/constants/urls";
import { CACHE_TTL } from "@/constants/timing";
import { STORAGE_KEYS } from "@/constants/storage";
import { setAppQueryClient } from "@/lib/queryClientHolder";
import { analyticsApi, pageTypeFromPath } from "@/services/platform/analytics.service";

function NotFoundComponent() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-netflix-black px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-netflix-red">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-white">{t("errors.notFoundTitle")}</h2>
        <p className="mt-2 text-sm text-netflix-muted">{t("errors.notFoundMessage")}</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded bg-netflix-red px-4 py-2 text-sm font-semibold text-white hover:bg-netflix-red-hover"
        >
          {t("errors.backHome")}
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation();

  console.error(error);

  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-netflix-black px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-white">{t("errors.genericTitle")}</h1>
        <p className="mt-2 text-sm text-netflix-muted">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();

              reset();
            }}
            className="rounded bg-netflix-red px-4 py-2 text-sm font-semibold text-white hover:bg-netflix-red-hover"
          >
            {t("common.retry")}
          </button>
          <a
            href="/"
            className="rounded border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            {t("errors.homeBtn")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        name: "google-site-verification",
        content: "YKYsmUTsp9tDWb_awzoJ_SItaHdMmtEMtJ5c6mu8PyA",
      },
      { title: t("seo.defaultTitle") },
      {
        name: "description",
        content: t("seo.defaultDescription"),
      },
      { name: "theme-color", content: "#0a0a0a" },
      { property: "og:site_name", content: "Cine-Flow" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: t("seo.defaultTitle") },
      {
        property: "og:description",
        content: t("seo.ogDescription"),
      },
      {
        property: "og:locale",
        content: i18n.language?.startsWith("en") ? "en_US" : "vi_VN",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: t("seo.defaultTitle") },
      {
        name: "twitter:description",
        content: t("seo.ogDescription"),
      },
    ],
    links: [
      { rel: "preconnect", href: EXTERNAL_URLS.googleFontsApi },
      {
        rel: "preconnect",
        href: EXTERNAL_URLS.googleFontsStatic,
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: EXTERNAL_URLS.interFontCss,
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      ...MOVIE_IMAGE_ORIGINS.flatMap((href) => [
        { rel: "preconnect", href, crossOrigin: "anonymous" as const },
        { rel: "dns-prefetch", href },
      ]),
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: serializeJsonLd({
          "@context": EXTERNAL_URLS.schemaContext,
          "@type": "WebSite",
          name: "Cine-Flow",
          url: getSiteUrl(),
          potentialAction: {
            "@type": "SearchAction",
            target: `${getSiteUrl()}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function LangShell({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState(() => (i18n.language?.startsWith("en") ? "en" : "vi"));

  useEffect(() => {
    const onChange = (lng: string) => setLang(lng.startsWith("en") ? "en" : "vi");

    i18n.on("languageChanged", onChange);

    return () => i18n.off("languageChanged", onChange);
  }, []);

  return (
    <html lang={lang}>
      <head>
        <HeadContent />
      </head>
      <body className="bg-netflix-black">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootShell({ children }: { children: React.ReactNode }) {
  return <LangShell>{children}</LangShell>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const initialize = useAuthStore((state) => state.initialize);

  const authLoading = useAuthStore((state) => state.isLoading);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    setAppQueryClient(queryClient);
  }, [queryClient]);

  useEffect(() => {
    void import("@/lib/envCheck").then((m) => m.runStartupEnvCheck());

    void initialize();

    let cleanup: (() => void) | undefined;

    let cancelled = false;

    const restorePersistedCache = async () => {
      if (cancelled) return;

      const [{ persistQueryClient }, { createSyncStoragePersister }] = await Promise.all([
        import("@tanstack/react-query-persist-client"),
        import("@tanstack/query-sync-storage-persister"),
      ]);

      const persister = createSyncStoragePersister({
        storage: window.localStorage,
        key: STORAGE_KEYS.reactQueryCache,
        throttleTime: 1000,
      });

      const [unsub] = persistQueryClient({
        queryClient,
        persister,
        maxAge: CACHE_TTL.day,
        // v5: drops caches persisted before details/searches were excluded (could be MBs).
        buster: "v5",
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) && shouldPersistQuery(query.queryKey),
        },
      });

      if (cancelled) unsub();
      else cleanup = unsub;
    };

    // Restore only once the page has loaded and gone idle. Route components hydrate in their
    // own Suspense passes after this effect; cached data showing up before that made their
    // first render differ from the server HTML (React #418) for returning visitors, and
    // React then discarded the SSR markup and re-rendered the whole page.
    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };

    const scheduleRestore = () => {
      if (idleWindow.requestIdleCallback) {
        idleWindow.requestIdleCallback(() => void restorePersistedCache(), { timeout: 3000 });
      } else {
        window.setTimeout(() => void restorePersistedCache(), 500);
      }
    };

    if (document.readyState === "complete") scheduleRestore();
    else window.addEventListener("load", scheduleRestore, { once: true });

    return () => {
      cancelled = true;

      window.removeEventListener("load", scheduleRestore);

      cleanup?.();
    };
  }, [initialize, queryClient]);

  const location = useLocation();

  const navigate = useNavigate();

  const isAdmin = location.pathname.startsWith("/admin");

  const isAuthRoute = isPublicAuthPath(location.pathname);

  // Unknown URLs render the 404 page for everyone instead of bouncing guests to /login.
  const isNotFound = useRouterState({
    select: (s) => s.matches.some((m) => m.globalNotFound || m.status === "notFound"),
  });

  const isPublic = isNotFound || isPublicPath(location.pathname);

  const authBlocked = !isPublic && authLoading;

  const needsLogin = !isPublic && !authLoading && !isAuthenticated;

  const hideProtectedShell = authBlocked || needsLogin;

  const loginRedirect = needsLogin
    ? buildLoginRedirect(location.pathname, location.searchStr)
    : undefined;

  useEffect(() => {
    registerAuthNavigator((opts) => {
      navigate({ to: opts.to, search: opts.search });
    });
  }, [navigate]);

  useEffect(() => {
    void analyticsApi.trackPageView(pageTypeFromPath(location.pathname));
  }, [location.pathname]);

  useWatchlistSync();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TopProgress />
        {!isAdmin && !isAuthRoute && !hideProtectedShell && <Navbar />}
        <main className={isAuthRoute ? "" : "min-h-screen pb-20 pt-0 lg:pb-0"}>
          {needsLogin ? (
            <Navigate
              to="/login"
              search={loginRedirect ? { redirect: loginRedirect } : undefined}
              replace
            />
          ) : authBlocked ? (
            <AuthGateLoader />
          ) : (
            <Outlet />
          )}
        </main>
        {!isAdmin && !isAuthRoute && !hideProtectedShell && <ContinueWatchingBar />}
        {!isAdmin && !isAuthRoute && !hideProtectedShell && <Footer />}
        {!isAdmin && !isAuthRoute && !hideProtectedShell && isAuthenticated && (
          <>
            <LazyChatModal />
            <ChatTriggerButton />
          </>
        )}

        <Toaster position="bottom-right" richColors theme="dark" duration={3000} />
      </I18nProvider>
    </QueryClientProvider>
  );
}

const ChatModal = lazy(() =>
  import("@/components/chat/ChatModal").then((m) => ({ default: m.ChatModal })),
);

/**
 * Mount the chat (and its markdown renderer) only after it is first opened: it used to load
 * on every page for signed-in users and fetch the conversation list each time.
 */
function LazyChatModal() {
  const isOpen = useChatStore((s) => s.isOpen);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <ChatModal />
    </Suspense>
  );
}

/**
 * Persist small, frequently reused lists only. Movie details (full episode lists, up to
 * ~100KB each), searches and admin data piled up in localStorage until writes such as the
 * refresh token started failing with QuotaExceededError.
 */
function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const [scope, kind] = queryKey;

  if (scope === "favorites" && kind === "slugs") return false;

  if (scope === "admin" || scope === "wp-detail") return false;

  if (scope === "movies" && ["detail", "search", "search-inf", "list-page"].includes(String(kind)))
    return false;

  return true;
}

function AuthGateLoader() {
  return <PageSkeleton />;
}
