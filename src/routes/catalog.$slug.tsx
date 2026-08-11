import { useMemo, useTransition } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useTranslation } from "react-i18next";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { FilterBar } from "@/components/filters/FilterBar";
import { Pagination } from "@/components/filters/Pagination";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { filterSearchSchema, optionalPage, hasActiveFilters } from "@/lib/filterSearch";
import { buildListingHead } from "@/lib/seo/seo";
import { t } from "@/lib/i18n";
import { getMovieListLabel } from "@/constants/movieLists";
import { useMoviesByTypePaged } from "@/hooks/useMovies";
import { useScrollToTopOnChange } from "@/hooks/useScrollToTopOnChange";

export const Route = createFileRoute("/catalog/$slug")({
  validateSearch: zodValidator(filterSearchSchema),
  head: ({ params }) => {
    const name = getMovieListLabel(params.slug);

    return buildListingHead({
      title: `${name} — Cine-Flow`,
      description: t("seo.listDescription", { name }),
      path: `/catalog/${params.slug}`,
    });
  },
  component: ListPage,
});

function ListPage() {
  const { t: tr } = useTranslation();

  const { slug } = Route.useParams();

  const search = Route.useSearch();

  const navigate = useNavigate({ from: Route.fullPath });

  const page = search.page ?? 1;

  const [isPending, startTransition] = useTransition();

  const { data, isFetching, isPlaceholderData } = useMoviesByTypePaged(slug, page, search);

  const items = data?.items ?? [];

  const totalPages = data?.pagination?.totalPages ?? 0;

  const title = useMemo(() => getMovieListLabel(slug), [slug]);

  useScrollToTopOnChange(page);

  return (
    <div className="pt-24 pb-4 md:pb-8">
      <div className="px-4 md:px-12">
        <Breadcrumb items={[{ label: tr("nav.home"), to: "/" }, { label: title }]} />
        <h1 className="mb-6 text-2xl font-bold text-white md:text-3xl">{title}</h1>
        <FilterBar
          value={search}
          onChange={(next) =>
            startTransition(() => navigate({ search: { ...next, page: undefined }, replace: true }))
          }
        />
      </div>
      <div className={isPending ? "pointer-events-none opacity-60 transition-opacity" : ""}>
        <MovieGrid
          movies={items}
          isLoading={isFetching && !isPlaceholderData && items.length === 0}
          hasFilters={hasActiveFilters(search)}
          onClearFilters={() =>
            startTransition(() => navigate({ search: { page: undefined }, replace: true }))
          }
        />
      </div>
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
