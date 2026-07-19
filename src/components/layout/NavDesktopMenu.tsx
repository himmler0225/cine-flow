import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { NavDropdown } from "@/components/layout/NavDropdown";
import { POPULAR_COUNTRY_ORDER, FALLBACK_GENRES, OTHER_LINKS } from "@/components/layout/NavData";
import { useGenres, useCountries } from "@/hooks/useGenres";

const DIRECT_LINKS = [
  { to: "/", labelKey: "nav.home", match: (p: string) => p === "/" },
  {
    to: "/catalog/$slug",
    params: { slug: "phim-bo" },
    labelKey: "nav.series",
    match: (p: string) => p === "/catalog/phim-bo",
  },
  {
    to: "/catalog/$slug",
    params: { slug: "phim-le" },
    labelKey: "nav.movies",
    match: (p: string) => p === "/catalog/phim-le",
  },
  {
    to: "/catalog/$slug",
    params: { slug: "tv-shows" },
    labelKey: "nav.tvShows",
    match: (p: string) => p === "/catalog/tv-shows",
  },
] as const;

function genreLabel(g: { slug: string; name?: string }, t: (key: string) => string): string {
  return g.name ?? t(`genres.${g.slug}`);
}

type Props = {
  path: string;
};

export function NavDesktopMenu({ path }: Props) {
  const { t } = useTranslation();
  const { data: genres } = useGenres();
  const { data: countries } = useCountries();

  const genreList = (genres && genres.length > 0 ? genres : FALLBACK_GENRES).slice(0, 18);
  const sortedCountries = (countries ?? []).slice().sort((a, b) => {
    const ai = POPULAR_COUNTRY_ORDER.indexOf(a.slug);
    const bi = POPULAR_COUNTRY_ORDER.indexOf(b.slug);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const countryList = sortedCountries.slice(0, 12);

  return (
    <nav className="hidden items-center gap-4 text-sm md:flex lg:gap-5">
      {DIRECT_LINKS.map((n) => (
        <Link
          key={n.labelKey}
          to={n.to as never}
          // @ts-expect-error router params
          params={n.params}
          className={cn(
            "relative whitespace-nowrap py-1 text-netflix-text/80 transition-colors hover:text-white",
            n.match(path) &&
              "text-white after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-netflix-red",
          )}
        >
          {t(n.labelKey)}
        </Link>
      ))}

      <NavDropdown label={t("nav.genres")} active={path.startsWith("/genre")} width="min-w-[480px]">
        {(close) => (
          <>
            <div className="mb-3 border-b border-gray-700/50 pb-2 text-xs uppercase tracking-wider text-gray-500">
              {t("nav.genresTitle")}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {genreList.map((g) => (
                <Link
                  key={g.slug}
                  to="/genre/$slug"
                  params={{ slug: g.slug }}
                  onClick={close}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white",
                    path === `/genre/${g.slug}` && "bg-red-950/30 text-red-400",
                  )}
                >
                  {genreLabel(g, t)}
                </Link>
              ))}
            </div>
            <div className="mt-3 border-t border-gray-700/50 pt-2">
              <Link
                to="/genre"
                onClick={close}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-netflix-red hover:bg-gray-800"
              >
                {t("nav.viewAllGenres")}
              </Link>
            </div>
          </>
        )}
      </NavDropdown>

      <NavDropdown
        label={t("nav.countries")}
        active={path.startsWith("/country")}
        width="min-w-[480px]"
      >
        {(close) => (
          <>
            <div className="mb-3 border-b border-gray-700/50 pb-2 text-xs uppercase tracking-wider text-gray-500">
              {t("nav.countriesTitle")}
            </div>
            {countryList.length === 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-9 animate-pulse rounded-lg bg-gray-800/60" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {countryList.map((c) => (
                  <Link
                    key={c.slug}
                    to="/country/$slug"
                    params={{ slug: c.slug }}
                    onClick={close}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white",
                      path === `/country/${c.slug}` && "bg-red-950/30 text-red-400",
                    )}
                  >
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-3 border-t border-gray-700/50 pt-2">
              <Link
                to="/country"
                onClick={close}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-netflix-red hover:bg-gray-800"
              >
                {t("nav.viewAllCountries")}
              </Link>
            </div>
          </>
        )}
      </NavDropdown>

      <NavDropdown label={t("nav.other")} width="min-w-[240px]" align="right">
        {(close) => (
          <div className="flex flex-col gap-0.5">
            {OTHER_LINKS.map((slug) => (
              <Link
                key={slug}
                to="/catalog/$slug"
                params={{ slug }}
                onClick={close}
                className="rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                {t(`otherLinks.${slug}`)}
              </Link>
            ))}
            <div className="my-1 border-t border-gray-700/50" />
            <Link
              to="/year/$year"
              params={{ year: "2025" }}
              onClick={close}
              className="rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              {t("nav.releaseYear", { year: "2025" })}
            </Link>
          </div>
        )}
      </NavDropdown>
    </nav>
  );
}
