import { useEffect, useId, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  X,
  Home,
  Tv,
  Film as FilmIcon,
  Radio,
  Heart,
  User,
  ChevronDown,
  Globe,
  Theater,
  ListPlus,
  Users,
} from "lucide-react";
import { useGenres, useCountries } from "@/hooks/useGenres";
import { FALLBACK_GENRES } from "./NavData";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
  onJoinWatchParty?: () => void;
  onOpenAuth?: () => void;
}

function genreLabel(
  g: {
    slug: string;
    name?: string;
  },
  t: (key: string) => string,
): string {
  return g.name ?? t(`genres.${g.slug}`);
}

export function MobileDrawer({
  open,
  onClose,
  isAuthenticated,
  onJoinWatchParty,
  onOpenAuth,
}: MobileDrawerProps) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [genreOpen, setGenreOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const { data: genres } = useGenres();
  const { data: countries } = useCountries();
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const genreList = genres && genres.length > 0 ? genres : FALLBACK_GENRES;
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(t);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-[61] flex w-[85%] max-w-[340px] flex-col overflow-y-auto bg-netflix-black md:hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <span id={titleId}>
                <BrandLogo linked={false} imgClassName="h-7" />
              </span>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label={t("common.close")}
                className="rounded p-1 text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex flex-col p-2 text-sm text-white">
              <DrawerLink
                onClose={onClose}
                to="/"
                pathname={pathname}
                icon={<Home className="h-4 w-4" />}
                label={t("nav.home")}
                exact
              />
              <DrawerLink
                onClose={onClose}
                to="/catalog/$slug"
                params={{ slug: "phim-bo" }}
                pathname={pathname}
                matchPrefix="/catalog/phim-bo"
                icon={<Tv className="h-4 w-4" />}
                label={t("nav.series")}
              />
              <DrawerLink
                onClose={onClose}
                to="/catalog/$slug"
                params={{ slug: "phim-le" }}
                pathname={pathname}
                matchPrefix="/catalog/phim-le"
                icon={<FilmIcon className="h-4 w-4" />}
                label={t("nav.movies")}
              />
              <DrawerLink
                onClose={onClose}
                to="/catalog/$slug"
                params={{ slug: "tv-shows" }}
                pathname={pathname}
                matchPrefix="/catalog/tv-shows"
                icon={<Radio className="h-4 w-4" />}
                label={t("nav.tvShows")}
              />

              <button
                type="button"
                onClick={() => setGenreOpen((v) => !v)}
                className="mt-2 flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-white/5"
              >
                <span className="flex items-center gap-3">
                  <Theater className="h-4 w-4" />
                  {t("nav.genres")}
                </span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", genreOpen && "rotate-180")}
                />
              </button>
              <AnimatePresence>
                {genreOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-6 grid grid-cols-2 gap-1 py-1">
                      {genreList.map((g) => (
                        <Link
                          key={g.slug}
                          to="/genre/$slug"
                          params={{ slug: g.slug }}
                          onClick={onClose}
                          className={cn(
                            "rounded px-2 py-1.5 text-xs hover:bg-white/5 hover:text-white",
                            pathname === `/genre/${g.slug}`
                              ? "bg-white/10 text-white"
                              : "text-netflix-text/80",
                          )}
                        >
                          {genreLabel(g, t)}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => setCountryOpen((v) => !v)}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-white/5"
              >
                <span className="flex items-center gap-3">
                  <Globe className="h-4 w-4" />
                  {t("nav.countries")}
                </span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", countryOpen && "rotate-180")}
                />
              </button>
              <AnimatePresence>
                {countryOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-6 grid grid-cols-2 gap-1 py-1">
                      {(countries ?? []).map((c) => (
                        <Link
                          key={c.slug}
                          to="/country/$slug"
                          params={{ slug: c.slug }}
                          onClick={onClose}
                          className={cn(
                            "rounded px-2 py-1.5 text-xs hover:bg-white/5 hover:text-white",
                            pathname === `/country/${c.slug}`
                              ? "bg-white/10 text-white"
                              : "text-netflix-text/80",
                          )}
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="my-2 border-t border-white/10" />
              <DrawerLink
                onClose={onClose}
                to="/watchlist"
                pathname={pathname}
                icon={<ListPlus className="h-4 w-4" />}
                label={t("nav.watchlist")}
              />
              <DrawerLink
                onClose={onClose}
                to="/favorites"
                pathname={pathname}
                icon={<Heart className="h-4 w-4" />}
                label={t("nav.favorites")}
              />
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (isAuthenticated) onJoinWatchParty?.();
                  else onOpenAuth?.();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/5"
              >
                <Users className="h-4 w-4 text-netflix-red" />
                {t("nav.watchParty")}
              </button>
              <DrawerLink
                onClose={onClose}
                to="/profile"
                pathname={pathname}
                icon={<User className="h-4 w-4" />}
                label={t("nav.historyProfile")}
              />
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerLink({
  to,
  params,
  label,
  icon,
  onClose,
  pathname,
  matchPrefix,
  exact,
}: {
  to: string;
  params?: Record<string, string>;
  label: string;
  icon: React.ReactNode;
  onClose: () => void;
  pathname: string;
  matchPrefix?: string;
  exact?: boolean;
}) {
  const target = matchPrefix ?? (params ? to.replace("$slug", params.slug) : to);
  const active = exact
    ? pathname === target
    : pathname === target || pathname.startsWith(`${target}/`);
  return (
    <Link
      to={to as never}
      params={params as never}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5",
        active ? "bg-white/10 text-white" : "hover:bg-white/5",
      )}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      {label}
    </Link>
  );
}
