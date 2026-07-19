import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search } from "lucide-react";
import type { MovieAgg } from "@/types/admin";
import { useAdminMovies } from "@/hooks/admin/useAdminMovies";
import { getIntlLocale } from "@/lib/i18n";
import { useAdminStore } from "@/store/adminStore";
import { Section, SectionEmpty, SectionLoader } from "@/components/admin/Section";
import { AdminSelect } from "@/components/admin/AdminSelect";
import { MovieStatsPanel } from "@/components/admin/movies/MovieStatsPanel";

const searchSchema = z.object({ q: fallback(z.string().optional(), undefined).optional() });

export const Route = createFileRoute("/admin/movies")({
  validateSearch: zodValidator(searchSchema),
  component: MoviesPage,
});

function MoviesPage() {
  const { t, i18n } = useTranslation();
  const locale = getIntlLocale(i18n.language);
  const { q } = Route.useSearch();
  const { dateRange, getDateFrom } = useAdminStore();
  const [search, setSearch] = useState(q ?? "");
  const [sortBy, setSortBy] = useState<"views" | "completion" | "recent">("views");
  const [open, setOpen] = useState<MovieAgg | null>(null);

  const movies = useAdminMovies(dateRange, getDateFrom());

  const filtered = (movies.data ?? [])
    .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "views") return b.views - a.views;
      if (sortBy === "completion") return b.completion - a.completion;
      return b.lastWatched.localeCompare(a.lastWatched);
    });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">{t("admin.nav.movies")}</h1>
      <Section
        title={t("admin.movies.moviesWatchedCount", { count: filtered.length })}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.movies.searchPlaceholder")}
                className="w-52 rounded-md border border-white/10 bg-white/5 py-1.5 pl-7 pr-2 text-xs text-white focus:border-netflix-red focus:outline-none"
              />
            </div>
            <AdminSelect
              value={sortBy}
              onValueChange={setSortBy}
              options={[
                { value: "views", label: t("admin.movies.sortViews") },
                { value: "completion", label: t("admin.movies.sortCompletion") },
                { value: "recent", label: t("admin.movies.sortRecent") },
              ]}
            />
          </div>
        }
      >
        {movies.isLoading ? (
          <SectionLoader />
        ) : filtered.length === 0 ? (
          <SectionEmpty message={t("admin.movies.noDataInPeriod")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-2">#</th>
                  <th>{t("admin.common.movie")}</th>
                  <th className="text-right">{t("admin.common.views")}</th>
                  <th className="text-right">{t("admin.common.unique")}</th>
                  <th className="text-right">{t("admin.common.avgSeconds")}</th>
                  <th>{t("admin.common.completion")}</th>
                  <th>{t("admin.common.lastWatched")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((m, i) => (
                  <tr
                    key={m.slug}
                    onClick={() => setOpen(m)}
                    className="cursor-pointer border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="py-2 text-zinc-500">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {m.thumb && (
                          <img src={m.thumb} alt="" className="h-9 w-14 rounded object-cover" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{m.name}</p>
                          <p className="truncate text-[10px] font-mono text-zinc-500">{m.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-mono text-white">
                      {m.views.toLocaleString(locale)}
                    </td>
                    <td className="text-right text-zinc-300">{m.uniqueViewers}</td>
                    <td className="text-right text-zinc-400">{m.avgTime}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={`h-full ${
                              m.completion > 70
                                ? "bg-emerald-500"
                                : m.completion > 40
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(100, m.completion)}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-300">{m.completion.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="text-xs text-zinc-400">
                      {new Date(m.lastWatched).toLocaleDateString(locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <MovieStatsPanel movie={open} onClose={() => setOpen(null)} />
    </div>
  );
}
