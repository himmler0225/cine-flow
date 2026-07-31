import { lazy } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Users, Eye, Film, PartyPopper, Trash2 } from "lucide-react";
import { adminCommentsApi } from "@/services/platform/admin/comments.admin";
import { useAdminDashboard } from "@/hooks/admin/useAdminDashboard";
import { getIntlLocale } from "@/lib/i18n";
import { useAdminStore } from "@/store/adminStore";
import { StatCard } from "@/components/admin/StatCard";
import { Section, SectionEmpty, SectionLoader } from "@/components/admin/Section";
import { ChartSuspense } from "@/components/admin/charts/ChartSuspense";
import { getUserInitial } from "@/lib/userDisplay";
import { isPremiumPlan } from "@/constants/premium";

const DashboardTrafficChart = lazy(() => import("@/components/admin/charts/DashboardTrafficChart"));

const DashboardPageTypeChart = lazy(
  () => import("@/components/admin/charts/DashboardPageTypeChart"),
);

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { t, i18n } = useTranslation();
  const locale = getIntlLocale(i18n.language);
  const { dateRange, getDateFrom, getPrevDateFrom } = useAdminStore();
  const from = getDateFrom();
  const prevFrom = getPrevDateFrom();
  const { stats, lineData, pieData, topMovies, topKeywords, recentUsers, recentComments } =
    useAdminDashboard(dateRange, from, prevFrom, useAdminStore.getState().getRangeDays());
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">{t("admin.nav.dashboard")}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label={t("admin.dashboard.totalUsers")}
          value={stats.data?.totalUsers ?? 0}
          change={stats.data?.users.change}
          loading={stats.isLoading}
        />
        <StatCard
          icon={<Eye className="h-4 w-4" />}
          label={t("admin.dashboard.pageViews")}
          value={stats.data?.pageViews.now ?? 0}
          change={stats.data?.pageViews.change}
          loading={stats.isLoading}
        />
        <StatCard
          icon={<Film className="h-4 w-4" />}
          label={t("admin.dashboard.movieViews")}
          value={stats.data?.watch.now ?? 0}
          change={stats.data?.watch.change}
          loading={stats.isLoading}
        />
        <StatCard
          icon={<PartyPopper className="h-4 w-4" />}
          label={t("admin.dashboard.watchPartyRooms")}
          value={stats.data?.rooms.now ?? 0}
          change={stats.data?.rooms.change}
          loading={stats.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Section title={t("admin.dashboard.trafficByDay")} className="lg:col-span-3">
          {lineData.isLoading ? (
            <SectionLoader />
          ) : (
            <ChartSuspense>
              <DashboardTrafficChart data={lineData.data ?? []} />
            </ChartSuspense>
          )}
        </Section>

        <Section title={t("admin.dashboard.pageTypeDistribution")} className="lg:col-span-2">
          {pieData.isLoading ? (
            <SectionLoader />
          ) : (pieData.data?.length ?? 0) === 0 ? (
            <SectionEmpty message={t("admin.dashboard.noPageViews")} />
          ) : (
            <ChartSuspense>
              <DashboardPageTypeChart data={pieData.data ?? []} />
            </ChartSuspense>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title={t("admin.dashboard.topMovies")}>
          {topMovies.isLoading ? (
            <SectionLoader />
          ) : (topMovies.data?.length ?? 0) === 0 ? (
            <SectionEmpty message={t("admin.dashboard.noViewsInPeriod")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="py-2">#</th>
                    <th>{t("admin.dashboard.movieName")}</th>
                    <th className="text-right">{t("admin.common.views")}</th>
                    <th className="text-right">{t("admin.common.avgSeconds")}</th>
                  </tr>
                </thead>
                <tbody>
                  {topMovies.data?.map((m, i) => (
                    <tr key={m.slug} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 text-zinc-500">{i + 1}</td>
                      <td className="truncate text-white">
                        <Link
                          to="/admin/movies"
                          search={{ q: m.slug }}
                          className="hover:text-netflix-red"
                        >
                          {m.name}
                        </Link>
                      </td>
                      <td className="text-right font-mono text-white">
                        {m.views.toLocaleString(locale)}
                      </td>
                      <td className="text-right text-zinc-400">{Math.round(m.avg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title={t("admin.dashboard.topKeywords")}>
          {topKeywords.isLoading ? (
            <SectionLoader />
          ) : (topKeywords.data?.length ?? 0) === 0 ? (
            <SectionEmpty message={t("admin.dashboard.noSearches")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="py-2">#</th>
                    <th>{t("admin.common.keyword")}</th>
                    <th className="text-right">{t("admin.common.searches")}</th>
                    <th className="text-right">{t("admin.common.ctr")}</th>
                  </tr>
                </thead>
                <tbody>
                  {topKeywords.data?.map((k, i) => (
                    <tr key={k.keyword} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 text-zinc-500">{i + 1}</td>
                      <td className="truncate text-white">{k.keyword}</td>
                      <td className="text-right font-mono text-white">{k.searches}</td>
                      <td className="text-right text-zinc-400">{(k.ctr * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title={t("admin.dashboard.recentUsers")}>
          {recentUsers.isLoading ? (
            <SectionLoader />
          ) : (recentUsers.data?.length ?? 0) === 0 ? (
            <SectionEmpty message={t("admin.dashboard.noRecentUsers")} />
          ) : (
            <ul className="divide-y divide-white/5">
              {recentUsers.data?.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-netflix-red text-xs font-bold text-white">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      getUserInitial(u.username)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">
                      {u.username ?? t("admin.common.noName")}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {new Date(u.created_at).toLocaleString(locale)}
                    </p>
                  </div>
                  {isPremiumPlan(u.plan) && (
                    <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                      {t("admin.common.premium")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title={t("admin.dashboard.recentComments")}
          action={
            <Link to="/admin/comments" className="text-xs text-netflix-red hover:underline">
              {t("admin.common.viewAll")}
            </Link>
          }
        >
          {recentComments.isLoading ? (
            <SectionLoader />
          ) : (recentComments.data?.length ?? 0) === 0 ? (
            <SectionEmpty message={t("admin.dashboard.noComments")} />
          ) : (
            <ul className="divide-y divide-white/5">
              {recentComments.data?.map((c) => (
                <li key={c.id} className="flex items-start gap-3 py-2">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-netflix-red text-[11px] font-bold text-white">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      getUserInitial(c.username)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-400">
                      <span className="font-semibold text-white">{c.username}</span> ·{" "}
                      <Link
                        to="/movie/$slug"
                        params={{ slug: c.movie_slug }}
                        className="text-netflix-red hover:underline"
                      >
                        {c.movie_slug}
                      </Link>
                    </p>
                    <p className="truncate text-sm text-zinc-200">{c.content}</p>
                    <p className="text-[10px] text-zinc-500">
                      {new Date(c.created_at).toLocaleString(locale)}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await adminCommentsApi.deleteById(c.id);
                      recentComments.refetch();
                    }}
                    className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                    title={t("admin.common.delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
