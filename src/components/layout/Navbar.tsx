import { lazy, Suspense, useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { NavDesktopMenu } from "@/components/layout/NavDesktopMenu";
import { NavToolbar } from "@/components/layout/NavToolbar";
import { useNavbarUiStore } from "@/components/layout/store/navbarUiStore";

const SearchModal = lazy(() =>
  import("@/components/search/SearchModal").then((m) => ({ default: m.SearchModal })),
);

const JoinRoomModal = lazy(() =>
  import("@/components/watchparty/JoinRoomModal").then((m) => ({ default: m.JoinRoomModal })),
);

export function Navbar() {
  const { t } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const requestAuth = useAuthStore((s) => s.requestAuth);
  const scrolled = useNavbarUiStore((s) => s.scrolled);
  const openSearch = useNavbarUiStore((s) => s.openSearch);
  const openJoin = useNavbarUiStore((s) => s.openJoin);
  const openDrawer = useNavbarUiStore((s) => s.openDrawer);
  const setScrolled = useNavbarUiStore((s) => s.setScrolled);
  const setOpenSearch = useNavbarUiStore((s) => s.setOpenSearch);
  const setOpenJoin = useNavbarUiStore((s) => s.setOpenJoin);
  const setOpenDrawer = useNavbarUiStore((s) => s.setOpenDrawer);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [setScrolled]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpenSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpenSearch]);
  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-netflix-black/95 backdrop-blur shadow-lg"
            : "bg-gradient-to-b from-netflix-black/90 to-transparent",
        )}
      >
        <div className="flex h-14 min-w-0 items-center justify-between gap-1 px-2 sm:h-16 sm:gap-2 sm:px-3 md:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6">
            <button
              type="button"
              onClick={() => setOpenDrawer(true)}
              className="rounded p-2 text-white md:hidden"
              aria-label={t("nav.openMenu")}
            >
              <Menu className="h-5 w-5" />
            </button>
            <BrandLogo />
            <NavDesktopMenu path={path} />
          </div>
          <NavToolbar isAuthenticated={isAuthenticated} />
        </div>
      </header>
      <Suspense fallback={null}>
        {openSearch && <SearchModal open={openSearch} onClose={() => setOpenSearch(false)} />}
        {openJoin && <JoinRoomModal open={openJoin} onClose={() => setOpenJoin(false)} />}
      </Suspense>
      <MobileDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        onJoinWatchParty={isAuthenticated ? () => setOpenJoin(true) : undefined}
        onOpenAuth={() => requestAuth("login")}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
