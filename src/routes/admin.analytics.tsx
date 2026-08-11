import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAdminAnalytics } from "@/hooks/admin/useAdminAnalytics";
import { useAdminStore } from "@/store/adminStore";
import { StatCard } from "@/components/admin/StatCard";
import { Section, SectionEmpty, SectionLoader } from "@/components/admin/Section";
import { ChartSuspense } from "@/components/admin/charts/ChartSuspense";
import { PartyPopper, Users, MessageSquare, Clock } from "lucide-react";

const AnalyticsSearchBarChart = lazy(
  () => import("@/components/admin/charts/AnalyticsSearchBarChart"),
);

const AnalyticsHourlyBarChart = lazy(
  () => import("@/components/admin/charts/AnalyticsHourlyBarChart"),
);

const AnalyticsSimpleBarChart = lazy(
  () => import("@/components/admin/charts/AnalyticsSimpleBarChart"),
);

const AdminPieChart = lazy(() => import("@/components/admin/charts/AdminPieChart"));

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { t } = useTranslation();

  const { dateRange, getDateFrom } = useAdminStore();

  const from = getDateFrom();

  const { search, hourly, rooms, langQuality } = useAdminAnalytics(dateRange, from);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">{t("admin.nav.analytics")}</h1>
      <Section title={t("admin.analytics.searchBehavior")}>
        {search.isLoading ? (
          <SectionLoader />
        ) : (search.data?.top.length ?? 0) === 0 ? (
          <SectionEmpty message={t("admin.analytics.noSearchData")} />
        ) : (
          <>
            <ChartSuspense>
              <AnalyticsSearchBarChart data={search.data!.top} />
            </ChartSuspense>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="py-2">{t("admin.common.keyword")}</th>
                    <th className="text-right">{t("admin.common.searches")}</th>
                    <th className="text-right">{t("admin.analytics.avgResults")}</th>
                    <th className="text-right">{t("admin.common.ctr")}</th>
                  </tr>
                </thead>
                <tbody>
                  {search.data?.top.map((k) => (
                    <tr key={k.keyword} className="border-b border-white/5">
                      <td className="py-1.5 text-white">{k.keyword}</td>
                      <td className="text-right font-mono">{k.searches}</td>
                      <td className="text-right text-zinc-400">{k.avgResults}</td>
                      <td className="text-right text-zinc-400">{k.ctr.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      {search.data?.noResults?.length ? (
        <Section
          title={t("admin.analytics.noResultSearches")}
          className="border-amber-500/30 bg-amber-500/5"
        >
          <p className="mb-2 text-xs text-amber-300">{t("admin.analytics.noResultHint")}</p>
          <div className="flex flex-wrap gap-1.5">
            {search.data.noResults.map((k) => (
              <span
                key={k.keyword}
                className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200"
              >
                {k.keyword} <span className="text-amber-400/60">×{k.searches}</span>
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      <Section
        title={
          hourly.data?.peak
            ? t("admin.analytics.peakHoursWithTime", { hour: hourly.data.peak.hour })
            : t("admin.analytics.peakHours")
        }
      >
        {hourly.isLoading ? (
          <SectionLoader />
        ) : (
          <ChartSuspense>
            <AnalyticsHourlyBarChart
              data={hourly.data?.hours ?? []}
              peakHour={hourly.data?.peak.hour}
            />
          </ChartSuspense>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<PartyPopper className="h-4 w-4" />}
          label={t("admin.analytics.roomsToday")}
          value={rooms.data?.today ?? 0}
          loading={rooms.isLoading}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label={t("admin.analytics.avgMembersPerRoom")}
          value={rooms.data?.avgMembers ?? 0}
          loading={rooms.isLoading}
        />
        <StatCard
          icon={<MessageSquare className="h-4 w-4" />}
          label={t("admin.analytics.avgMessagesPerRoom")}
          value={rooms.data?.avgMsgs ?? 0}
          loading={rooms.isLoading}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label={t("admin.analytics.avgDurationMinutes")}
          value={rooms.data?.avgDuration ?? 0}
          loading={rooms.isLoading}
        />
      </div>

      <Section title={t("admin.analytics.roomsByDay")}>
        {rooms.isLoading ? (
          <SectionLoader />
        ) : (rooms.data?.days.length ?? 0) === 0 ? (
          <SectionEmpty message={t("admin.analytics.noRoomsInPeriod")} />
        ) : (
          <ChartSuspense>
            <AnalyticsSimpleBarChart data={rooms.data!.days} />
          </ChartSuspense>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title={t("admin.analytics.movieLanguage")}>
          {langQuality.isLoading ? (
            <SectionLoader />
          ) : (langQuality.data?.lang.length ?? 0) === 0 ? (
            <SectionEmpty message={t("admin.common.noData")} />
          ) : (
            <ChartSuspense>
              <AdminPieChart data={langQuality.data!.lang} />
            </ChartSuspense>
          )}
        </Section>
        <Section title={t("admin.analytics.movieQuality")}>
          {langQuality.isLoading ? (
            <SectionLoader />
          ) : (langQuality.data?.quality.length ?? 0) === 0 ? (
            <SectionEmpty message={t("admin.common.noData")} />
          ) : (
            <ChartSuspense>
              <AdminPieChart data={langQuality.data!.quality} />
            </ChartSuspense>
          )}
        </Section>
      </div>
    </div>
  );
}
