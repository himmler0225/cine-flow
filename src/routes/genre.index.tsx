import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useGenres } from "@/hooks/useGenres";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { t } from "@/lib/i18n";

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-800/60" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {(genres ?? []).map((g) => (
              <Link
                key={g.slug}
                to="/genre/$slug"
                params={{ slug: g.slug }}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white transition-colors hover:border-netflix-red hover:bg-netflix-red/10"
              >
                {g.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
