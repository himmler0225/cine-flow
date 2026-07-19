import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  Navigate,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TopProgress } from "@/components/layout/TopProgress";
import { ContinueWatchingBar } from "@/components/movie/ContinueWatchingBar";
import { AiAssistantModal } from "@/features/ai-chat/ui/AiAssistantModal";
import { useWatchlistSync } from "@/hooks/useWatchlistSync";
import { I18nProvider } from "@/components/common/I18nProvider";
import { registerAuthNavigator } from "@/lib/auth/authNavigation";
import { buildLoginRedirect, isPublicAuthPath } from "@/lib/auth/authRoutes";
import { useAuthStore } from "@/store/authStore";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import i18n, { t } from "@/lib/i18n";
import { EXTERNAL_URLS, MOVIE_IMAGE_ORIGINS } from "@/constants/urls";
import { CACHE_TTL } from "@/constants/timing";

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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
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
        children: JSON.stringify({
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
    void import("@/lib/envCheck").then((m) => m.runStartupEnvCheck());
    void initialize();
    // Persist React Query cache vào localStorage để lần sau mở app có data ngay
    let cleanup: (() => void) | undefined;
    (async () => {
      if (typeof window === "undefined") return;
      const [{ persistQueryClient }, { createSyncStoragePersister }] = await Promise.all([
        import("@tanstack/react-query-persist-client"),
        import("@tanstack/query-sync-storage-persister"),
      ]);
      const persister = createSyncStoragePersister({
        storage: window.localStorage,
        key: "kkflix-rq-cache",
        throttleTime: 1000,
      });
      const [unsub] = persistQueryClient({
        queryClient,
        persister,
        maxAge: CACHE_TTL.day,
        buster: "v2",
      });
      cleanup = unsub;
    })();
    return () => {
      cleanup?.();
    };
  }, [initialize, queryClient]);
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith("/admin");
  const isAuthRoute = isPublicAuthPath(location.pathname);
  const authBlocked = !isAuthRoute && authLoading;
  const needsLogin = !isAuthRoute && !authLoading && !isAuthenticated;
  const hideProtectedShell = authBlocked || needsLogin;
  const loginRedirect = needsLogin
    ? buildLoginRedirect(location.pathname, location.searchStr)
    : undefined;

  useEffect(() => {
    registerAuthNavigator((opts) => {
      navigate({ to: opts.to, search: opts.search });
    });
  }, [navigate]);

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
        {!isAdmin && !isAuthRoute && !hideProtectedShell && <AiAssistantModal />}
        {!isAdmin && !isAuthRoute && !hideProtectedShell && <Footer />}

        <Toaster position="bottom-right" richColors theme="dark" duration={3000} />
      </I18nProvider>
    </QueryClientProvider>
  );
}

function AuthGateLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-netflix-black">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-netflix-red" />
        <p className="mt-4 text-sm text-netflix-muted">{t("common.loading")}</p>
      </div>
    </div>
  );
}
