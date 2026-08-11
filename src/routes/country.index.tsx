import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCountries } from "@/hooks/useGenres";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/country/")({
  head: () => ({
    meta: [
      { title: t("seo.allCountriesTitle") },
      { name: "description", content: t("seo.allCountriesDescription") },
    ],
  }),
  component: AllCountries,
});

function AllCountries() {
  const { t: tr } = useTranslation();

  const { data: countries, isLoading } = useCountries();

  return (
    <div className="pt-24 pb-4 md:pb-8">
      <div className="px-4 md:px-12">
        <Breadcrumb
          items={[{ label: tr("nav.home"), to: "/" }, { label: tr("nav.countriesPage") }]}
        />
        <h1 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          {tr("listing.allCountries")}
        </h1>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="aspect-[16/10] animate-pulse rounded-xl bg-netflix-surface" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(countries ?? []).map((c, i) => (
              <Link
                key={c.slug}
                to="/country/$slug"
                params={{ slug: c.slug }}
                className={cn(
                  "group relative flex aspect-[16/10] items-end overflow-hidden rounded-xl border border-white/10 p-4 shadow-md shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-lg hover:shadow-black/30",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red",
                  TILE_TONES[i % TILE_TONES.length],
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
                />
                <Globe2
                  aria-hidden
                  strokeWidth={1.25}
                  className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 text-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:text-white/15"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent"
                />
                <span className="relative z-10 truncate text-sm font-semibold tracking-wide text-white md:text-base">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const TILE_TONES = [
  "bg-gradient-to-br from-netflix-red/35 to-netflix-surface",
  "bg-gradient-to-br from-cyan-900/40 to-netflix-surface",
  "bg-gradient-to-br from-orange-900/35 to-netflix-surface",
  "bg-gradient-to-br from-teal-900/40 to-netflix-surface",
  "bg-gradient-to-br from-lime-900/30 to-netflix-surface",
  "bg-gradient-to-br from-stone-700/45 to-netflix-surface",
] as const;
