import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNewMovies } from "@/hooks/useMovies";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { Pagination } from "@/components/filters/Pagination";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildListingHead } from "@/lib/seo/seo";
import { optionalPage } from "@/lib/filterSearch";
import { useScrollToTopOnChange } from "@/hooks/useScrollToTopOnChange";
import { t } from "@/lib/i18n";

const schema = z.object({
  page: fallback(z.coerce.number().int().min(1), 1).optional(),
});

export const Route = createFileRoute("/new")({
  validateSearch: zodValidator(schema),
  head: () =>
    buildListingHead({
      title: t("seo.newUpdatesTitle"),
      description: t("seo.newUpdatesDescription"),
      path: "/new",
    }),
  component: NewUpdatesPage,
});

function NewUpdatesPage() {
  const { t: tr } = useTranslation();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const page = search.page ?? 1;
  const { data, isFetching, isPlaceholderData } = useNewMovies(page);
  const items = data?.items ?? [];
  const totalPages = data?.pagination?.totalPages ?? 0;
  useScrollToTopOnChange(page);
  return (
    <div className="pt-24 pb-4 md:pb-8">
      <div className="px-4 md:px-12">
        <Breadcrumb
          items={[{ label: tr("nav.home"), to: "/" }, { label: tr("home.rows.newUpdates") }]}
        />
        <h1 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          {tr("home.rows.newUpdates")}
        </h1>
      </div>
      <MovieGrid
        movies={items}
        isLoading={isFetching && !isPlaceholderData && items.length === 0}
      />
      <div className="px-4 md:px-12">
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(p) => navigate({ search: { page: optionalPage(p) } })}
        />
      </div>
    </div>
  );
}
