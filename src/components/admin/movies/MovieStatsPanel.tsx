import { lazy } from "react";
import { useTranslation } from "react-i18next";
import { useAdminMovieStats } from "@/hooks/admin/useAdminMovies";
import { getIntlLocale } from "@/lib/i18n";
import type { MovieAgg } from "@/types/admin";
import { useAdminStore } from "@/store/adminStore";
import { SectionLoader } from "@/components/admin/Section";
import { SlidePanel } from "@/components/admin/SlidePanel";
import { ChartSuspense } from "@/components/admin/charts/ChartSuspense";
import { getUserInitial } from "@/lib/userDisplay";

const MovieViewsBarChart = lazy(() => import("@/components/admin/charts/MovieViewsBarChart"));

const MovieEpisodesBarChart = lazy(() => import("@/components/admin/charts/MovieEpisodesBarChart"));

const MovieServerPieChart = lazy(() => import("@/components/admin/charts/MovieServerPieChart"));

interface MovieStatsPanelProps {
  movie: MovieAgg | null;
  onClose: () => void;
}

export function MovieStatsPanel({ movie, onClose }: MovieStatsPanelProps) {
  const { t, i18n } = useTranslation();

  const { getDateFrom, dateRange } = useAdminStore();

  const locale = getIntlLocale(i18n.language);

  const data = useAdminMovieStats(movie?.slug ?? "", dateRange, getDateFrom(), !!movie);

  const byDay: {
    date: string;
    views: number;
  }[] = [];

  const byEp = new Map<string, number>();

  const byServer = new Map<string, number>();

  data.data?.forEach((r) => {
    const k = r.started_at.slice(0, 10);

    const i = byDay.findIndex((d) => d.date === k);

    if (i >= 0) byDay[i].views++;
    else byDay.push({ date: k.slice(5), views: 1 });

    if (r.episode_name) byEp.set(r.episode_name, (byEp.get(r.episode_name) ?? 0) + 1);

    if (r.server_name) byServer.set(r.server_name, (byServer.get(r.server_name) ?? 0) + 1);
  });

  byDay.sort((a, b) => a.date.localeCompare(b.date));

  const epData = [...byEp.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const serverData = [...byServer.entries()].map(([name, value]) => ({ name, value }));

  return (
    <SlidePanel
      open={!!movie}
      onClose={onClose}
      width={560}
      title={movie ? t("admin.movies.panelTitle", { name: movie.name }) : ""}
    >
      {movie && (
        <div className="space-y-4 p-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-zinc-400">
              {t("admin.movies.viewsByDay")}
            </p>
            {data.isLoading ? (
              <SectionLoader />
            ) : (
              <ChartSuspense>
                <MovieViewsBarChart data={byDay} />
              </ChartSuspense>
            )}
          </div>

          {epData.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-400">
                {t("admin.movies.topEpisodes")}
              </p>
              <ChartSuspense>
                <MovieEpisodesBarChart data={epData} />
              </ChartSuspense>
            </div>
          )}

          {serverData.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-400">
                {t("admin.movies.popularServers")}
              </p>
              <ChartSuspense>
                <MovieServerPieChart data={serverData} />
              </ChartSuspense>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold text-zinc-400">
              {t("admin.movies.recentViewers")}
            </p>
            <ul className="divide-y divide-white/5">
              {data.data?.slice(0, 20).map((r, i) => (
                <li key={i} className="flex items-center gap-2 py-1.5 text-xs">
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-netflix-red text-[10px] font-bold text-white">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      getUserInitial(r.username)
                    )}
                  </div>
                  <span className="flex-1 truncate text-zinc-200">
                    {r.username ?? t("admin.common.guest")} · {r.episode_name}
                  </span>
                  <span className="text-zinc-500">
                    {new Date(r.started_at).toLocaleString(locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </SlidePanel>
  );
}
