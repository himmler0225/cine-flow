import { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Search as SearchIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import { useSearch } from "@/hooks/useSearch";
import { MovieGrid } from "@/components/movie/MovieGrid";

const schema = z.object({ q: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(schema),
  head: () => ({
    meta: [{ title: t("seo.searchTitle") }, { name: "robots", content: "noindex, follow" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { t: tr } = useTranslation();
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [input, setInput] = useState(q);
  const { data, fetchNextPage, hasNextPage, isFetching, debounced } = useSearch(input);

  useEffect(() => {
    if (debounced !== q) {
      navigate({
        to: "/search",
        search: { q: debounced },
        replace: true,
      });
    }
  }, [debounced, q, navigate]);

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetching, fetchNextPage]);

  const items = data?.pages.flatMap((p) => p.items ?? []) ?? [];

  return (
    <div className="pt-24 pb-4 md:pb-8">
      <div className="px-4 md:px-12">
        <h1 className="mb-4 text-2xl font-bold text-white md:text-3xl">{tr("search.title")}</h1>
        <div className="mb-8 flex max-w-xl items-center gap-3 rounded border border-white/15 bg-netflix-surface px-4 py-3">
          <SearchIcon className="h-5 w-5 text-netflix-muted" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tr("search.placeholderShort")}
            className="flex-1 bg-transparent text-white placeholder:text-netflix-muted focus:outline-none"
          />
        </div>
      </div>

      {debounced.length < 2 ? (
        <p className="px-4 text-netflix-muted md:px-12">{tr("common.minChars")}</p>
      ) : (
        <>
          <MovieGrid movies={items} isLoading={isFetching && items.length === 0} />
          <div ref={sentinel} className="h-12" />
          {isFetching && items.length > 0 && (
            <p className="text-center text-sm text-netflix-muted">{tr("common.loading")}</p>
          )}
          {!hasNextPage && items.length > 0 && (
            <p className="text-center text-sm text-netflix-muted">{tr("common.endOfResults")}</p>
          )}
        </>
      )}
    </div>
  );
}
