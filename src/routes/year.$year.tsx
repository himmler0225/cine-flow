import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useTranslation } from "react-i18next";
import { usePagedByYear } from "@/hooks/useMovies";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { FilterBar } from "@/components/filters/FilterBar";
import { Pagination } from "@/components/filters/Pagination";
import { filterSearchSchema, optionalPage } from "@/lib/filterSearch";
import { buildListingHead } from "@/lib/seo/seo";
import { useScrollToTopOnChange } from "@/hooks/useScrollToTopOnChange";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/year/$year")({
  validateSearch: zodValidator(filterSearchSchema),
  head: ({ params }) =>
    buildListingHead({
      title: t("seo.yearTitle", { year: params.year }),
      description: t("seo.yearDescription", { year: params.year }),
      path: `/year/${params.year}`,
    }),
  component: YearPage,
});

function YearPage() {
  const { t: tr } = useTranslation();
  const { year } = Route.useParams();
  const yearNum = parseInt(year, 10);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const page = search.page ?? 1;

  const { data, isFetching, isPlaceholderData } = usePagedByYear(yearNum, page, search);

  const items = data?.items ?? [];
  const totalPages = data?.pagination?.totalPages ?? 0;

  useScrollToTopOnChange(page);

  return (
    <div className="pt-24 pb-4 md:pb-8">
      <div className="px-4 md:px-12">
        <h1 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          {tr("listing.year", { year })}
        </h1>
        <FilterBar
          value={search}
          onChange={(next) => navigate({ search: { ...next, page: undefined }, replace: true })}
          hide={["year"]}
        />
      </div>
      <MovieGrid
        movies={items}
        isLoading={isFetching && !isPlaceholderData && items.length === 0}
      />
      <div className="px-4 md:px-12">
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(p) => navigate({ search: { ...search, page: optionalPage(p) } })}
        />
      </div>
    </div>
  );
}
