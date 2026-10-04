import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HeroBanner } from "@/components/hero/HeroBanner";
import { MovieRow } from "@/components/movie/MovieRow";
import { MovieRowError } from "@/components/movie/MovieRowError";
import { TopRanking, useTop10 } from "@/components/movie/TopRanking";
import { useNewMovies, useMoviesByType } from "@/hooks/useMovies";
import { getHomeRows } from "@/constants/movie";
import { ContinueWatchingRow } from "@/components/movie/ContinueWatchingRow";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: t("seo.homeTitle") },
      {
        name: "description",
        content: t("seo.homeDescription"),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();

  const newMovies = useNewMovies(1);

  const trending = useTop10();

  const heroItems =
    trending.items.length > 0 ? trending.items.map((t) => t.m) : (newMovies.data?.items ?? []);

  const rows = getHomeRows().filter((r) => r.type);

  return (
    <div>
      <HeroBanner movies={heroItems} />
      <div className="relative z-10 space-y-2 pb-12 md:-mt-16">
        <ContinueWatchingRow />
        <MovieRow
          title={t("home.rows.newUpdates")}
          movies={newMovies.data?.items}
          isLoading={newMovies.isLoading}
          href={{ to: "/new" }}
        />{" "}
        <TopRanking />
        {rows.map((row, i) => (
          <LazyTypedRow key={row.key} type={row.type!} titleKey={row.titleKey} eager={i < 2} />
        ))}
      </div>
    </div>
  );
}

function LazyTypedRow({
  type,
  titleKey,
  eager,
}: {
  type: string;
  titleKey: string;
  eager: boolean;
}) {
  const { t } = useTranslation();

  const title = t(titleKey);

  const ref = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(eager);

  useEffect(() => {
    if (active) return;

    const el = ref.current;

    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setActive(true);

          obs.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, [active]);

  return (
    <div ref={ref} className="min-h-[280px]">
      {active ? <TypedRow type={type} titleKey={titleKey} /> : <MovieRow title={title} isLoading />}
    </div>
  );
}

function TypedRow({ type, titleKey }: { type: string; titleKey: string }) {
  const { t } = useTranslation();

  const title = t(titleKey);

  const { data, isLoading, isError, refetch } = useMoviesByType(type, 1);

  if (isError) {
    return (
      <MovieRowError
        title={title}
        message={t("movie.loadError", { title: title.toLowerCase() })}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <MovieRow
      title={title}
      movies={data?.items}
      isLoading={isLoading}
      href={{ to: "/catalog/$slug", params: { slug: type } }}
    />
  );
}
