import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  X,
  Home,
  Tv,
  Film as FilmIcon,
  Radio,
  Heart,
  History,
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

function genreLabel(g: { slug: string; name?: string }, t: (key: string) => string): string {
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
  const [genreOpen, setGenreOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const { data: genres } = useGenres();
  const { data: countries } = useCountries();

  const genreList = genres && genres.length > 0 ? genres : FALLBACK_GENRES;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

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
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-[61] flex w-[85%] max-w-[340px] flex-col overflow-y-auto bg-netflix-black md:hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <BrandLogo linked={false} imgClassName="h-7" />
              <button onClick={onClose} aria-label={t("common.close")}>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <nav className="flex flex-col p-2 text-sm text-white">
              <DrawerLink
                onClose={onClose}
                to="/"
                icon={<Home className="h-4 w-4" />}
                label={t("nav.home")}
              />
              <DrawerLink
                onClose={onClose}
                to="/catalog/$slug"
                params={{ slug: "phim-bo" }}
                icon={<Tv className="h-4 w-4" />}
                label={t("nav.series")}
              />
              <DrawerLink
                onClose={onClose}
                to="/catalog/$slug"
                params={{ slug: "phim-le" }}
                icon={<FilmIcon className="h-4 w-4" />}
                label={t("nav.movies")}
              />
              <DrawerLink
                onClose={onClose}
                to="/catalog/$slug"
                params={{ slug: "tv-shows" }}
                icon={<Radio className="h-4 w-4" />}
                label={t("nav.tvShows")}
              />

              <button
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
                          className="rounded px-2 py-1.5 text-xs text-netflix-text/80 hover:bg-white/5 hover:text-white"
                        >
                          {genreLabel(g, t)}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
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
                          className="rounded px-2 py-1.5 text-xs text-netflix-text/80 hover:bg-white/5 hover:text-white"
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
                icon={<ListPlus className="h-4 w-4" />}
                label={t("nav.watchlist")}
              />
              <DrawerLink
                onClose={onClose}
                to="/favorites"
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
                icon={<History className="h-4 w-4" />}
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
}: {
  to: string;
  params?: Record<string, string>;
  label: string;
  icon: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Link
      to={to as never}
      // @ts-expect-error router params
      params={params}
      onClick={onClose}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5"
    >
      {icon}
      {label}
    </Link>
  );
}
