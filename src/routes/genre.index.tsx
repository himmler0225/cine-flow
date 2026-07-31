import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useGenres } from "@/hooks/useGenres";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/genre/")({
  head: () => ({
    meta: [
      { title: t("seo.allGenresTitle") },
      { name: "description", content: t("seo.allGenresDescription") },
    ],
  }),
  component: AllGenres,
});

function AllGenres() {
  const { t: tr } = useTranslation();
  const { data: genres, isLoading } = useGenres();
  return (
    <div className="pt-24 pb-4 md:pb-8">
      <div className="px-4 md:px-12">
        <Breadcrumb items={[{ label: tr("nav.home"), to: "/" }, { label: tr("nav.genresPage") }]} />
        <h1 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          {tr("listing.allGenres")}
        </h1>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="aspect-[16/10] animate-pulse rounded-xl bg-netflix-surface" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(genres ?? []).map((g, i) => (
              <Link
                key={g.slug}
                to="/genre/$slug"
                params={{ slug: g.slug }}
                className={cn(
                  "group relative flex aspect-[16/10] items-end overflow-hidden rounded-xl border border-white/10 p-4 transition-transform hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red",
                  TILE_TONES[i % TILE_TONES.length],
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                />
                <span className="relative z-10 text-sm font-semibold text-white md:text-base">
                  {g.name}
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
  "bg-gradient-to-br from-netflix-red/40 to-netflix-surface",
  "bg-gradient-to-br from-amber-700/35 to-netflix-surface",
  "bg-gradient-to-br from-sky-800/40 to-netflix-surface",
  "bg-gradient-to-br from-emerald-800/35 to-netflix-surface",
  "bg-gradient-to-br from-rose-900/40 to-netflix-surface",
  "bg-gradient-to-br from-stone-700/45 to-netflix-surface",
] as const;
