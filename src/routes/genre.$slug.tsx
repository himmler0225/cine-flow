import { useMemo, useTransition } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useTranslation } from "react-i18next";
import { usePagedByGenre } from "@/hooks/useMovies";
import { useGenres } from "@/hooks/useGenres";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { FilterBar } from "@/components/filters/FilterBar";
import { Pagination } from "@/components/filters/Pagination";
import { filterSearchSchema, optionalPage, hasActiveFilters } from "@/lib/filterSearch";
import { buildItemListJsonLd, buildListingHead } from "@/lib/seo/seo";
import { serializeJsonLd } from "@/lib/seo/jsonLd";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { prettifySlug } from "@/utils/prettifySlug";
import { useScrollToTopOnChange } from "@/hooks/useScrollToTopOnChange";
import { t } from "@/lib/i18n";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { genresApi } from "@/services/movies";

export const Route = createFileRoute("/genre/$slug")({
  validateSearch: zodValidator(filterSearchSchema),
  loader: async ({ params, context }) => {
    try {
      const genres = await context.queryClient.ensureQueryData({
        queryKey: queryKeys.genres.all(),
        queryFn: () => genresApi.getAll(),
        staleTime: CACHE_TTL.hour,
      });

      const found = genres?.find((g) => g.slug === params.slug);

      return { name: found?.name ?? prettifySlug(params.slug) };
    } catch {
      return { name: prettifySlug(params.slug) };
    }
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.name ?? prettifySlug(params.slug);

    return buildListingHead({
      title: t("seo.genreTitle", { name }),
      description: t("seo.genreDescription", { name }),
      path: `/genre/${params.slug}`,
    });
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { t: tr } = useTranslation();

  const { slug } = Route.useParams();

  const search = Route.useSearch();

  const navigate = useNavigate({ from: Route.fullPath });

  const page = search.page ?? 1;

  const { data: genres } = useGenres();

  const [isPending, startTransition] = useTransition();

  const { data, isFetching, isPlaceholderData } = usePagedByGenre(slug, page, search);

  const items = useMemo(() => data?.items ?? [], [data]);

  const totalPages = data?.pagination?.totalPages ?? 0;

  const title = useMemo(
    () => genres?.find((g) => g.slug === slug)?.name ?? prettifySlug(slug),
    [genres, slug],
  );

  useScrollToTopOnChange(page);

  const jsonLd = useMemo(
    () =>
      items.length > 0
        ? serializeJsonLd(
            buildItemListJsonLd(items, {
              name: tr("listing.itemListGenre", { name: title }),
              url: `/genre/${slug}`,
            }),
          )
        : null,
    [items, title, slug, tr],
  );

  return (
    <div className="pt-24 pb-4 md:pb-8">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      <div className="px-4 md:px-12">
        <Breadcrumb
          items={[
            { label: tr("nav.home"), to: "/" },
            { label: tr("nav.genresPage"), to: "/genre" },
            { label: title },
          ]}
        />
        <h1 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          {tr("listing.genre", { name: title })}
        </h1>
        <FilterBar
          value={search}
          onChange={(next) =>
            startTransition(() => navigate({ search: { ...next, page: undefined }, replace: true }))
          }
          hide={["category"]}
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
