import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useCountries } from "@/hooks/useGenres";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { t } from "@/lib/i18n";

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-800/60" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {(countries ?? []).map((c) => (
              <Link
                key={c.slug}
                to="/country/$slug"
                params={{ slug: c.slug }}
                className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-colors hover:border-netflix-red hover:bg-netflix-red/10"
              >
                <span className="truncate">{c.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
