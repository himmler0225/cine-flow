import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CalendarDays, Hourglass } from "lucide-react";
import { MoviePosterImg } from "@/components/movie/MoviePosterImg";
import { seriesApi, type ScheduleEntry } from "@/services/platform/series.service";
import { useAuthStore } from "@/store/authStore";
import { CACHE_TTL } from "@/constants/timing";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [{ title: t("schedule.seoTitle") }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: SchedulePage,
});

const VN_OFFSET_MS = 7 * 3600_000;

const DAY_MS = 24 * 3600_000;

/** Start of the Vietnam calendar day containing `ms`. */
function vnDayStart(ms: number) {
  return Math.floor((ms + VN_OFFSET_MS) / DAY_MS) * DAY_MS - VN_OFFSET_MS;
}

function nextEpisodeLabel(entry: ScheduleEntry) {
  const n = Number(/(\d+)/.exec(entry.episode_current)?.[1]);

  const total = Number(/(\d+)/.exec(entry.episode_total ?? "")?.[1]);

  if (!n || (total && n >= total)) return null;

  return n + 1;
}

type Slot = { entry: ScheduleEntry; at: number };

function SchedulePage() {
  const { t, i18n } = useTranslation();

  const userId = useAuthStore((s) => (s.isAuthenticated ? s.user?.id : undefined));

  const { data = [], isLoading } = useQuery({
    queryKey: ["schedule", userId ?? ""],
    queryFn: () => seriesApi.schedule(),
    enabled: !!userId,
    staleTime: CACHE_TTL.tenMinutes,
  });

  const { days, unknown } = useMemo(() => {
    const now = Date.now();

    const today = vnDayStart(now);

    const days = Array.from({ length: 7 }, (_, i) => ({
      start: today + i * DAY_MS,
      slots: [] as Slot[],
    }));

    const unknown: ScheduleEntry[] = [];

    for (const entry of data) {
      if (!entry.pattern || !nextEpisodeLabel(entry)) {
        if (!entry.pattern) unknown.push(entry);

        continue;
      }

      for (const day of days) {
        const weekday = new Date(day.start + VN_OFFSET_MS).getUTCDay();

        if (entry.pattern.weekdays.includes(weekday)) {
          day.slots.push({ entry, at: day.start + entry.pattern.minuteOfDay * 60_000 });
        }
      }
    }

    days.forEach((d) => d.slots.sort((a, b) => a.at - b.at));

    return { days, unknown };
  }, [data]);

  const dayLabel = (start: number, i: number) =>
    i === 0
      ? t("schedule.today")
      : i === 1
        ? t("schedule.tomorrow")
        : new Date(start + 12 * 3600_000).toLocaleDateString(i18n.language, {
            weekday: "long",
            day: "numeric",
            month: "numeric",
          });

  const time = (ms: number) =>
    new Date(ms).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="px-4 pb-12 pt-24 md:px-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white md:text-3xl">
        <CalendarDays className="h-7 w-7 text-netflix-red" />
        {t("schedule.title")}
      </h1>
      <p className="mt-1 text-sm text-netflix-muted">{t("schedule.subtitle")}</p>

      {isLoading ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="mt-16 text-center text-netflix-muted">
          <p>{t("schedule.empty")}</p>
          <Link
            to="/catalog/$slug"
            params={{ slug: "phim-bo" }}
            className="mt-2 inline-block text-netflix-red hover:underline"
          >
            {t("schedule.findSeries")}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {days.map((day, i) => (
              <section
                key={day.start}
                className={cn(
                  "rounded-xl border p-3",
                  i === 0
                    ? "border-netflix-red/50 bg-netflix-red/5"
                    : "border-white/10 bg-white/[0.03]",
                )}
              >
                <h2 className="mb-2 text-sm font-semibold capitalize text-white">
                  {dayLabel(day.start, i)}
                </h2>
                {day.slots.length === 0 ? (
                  <p className="py-4 text-center text-xs text-netflix-muted">—</p>
                ) : (
                  <ul className="space-y-2">
                    {day.slots.map(({ entry, at }) => (
                      <li key={entry.slug}>
                        <Link
                          to="/movie/$slug"
                          params={{ slug: entry.slug }}
                          className="flex gap-2 rounded-lg p-1 transition-colors hover:bg-white/5"
                        >
                          <MoviePosterImg
                            slug={entry.slug}
                            thumbUrl={entry.poster_url || entry.thumb_url}
                            alt=""
                            className="h-14 w-10 shrink-0 rounded object-cover"
                          />
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-xs font-medium text-white">
                              {entry.name}
                            </p>
                            <p className="text-[11px] text-netflix-red">
                              {t("schedule.episode", { n: nextEpisodeLabel(entry) })} · ~{time(at)}
                            </p>
                            {entry.pattern?.confidence === "guess" && (
                              <p className="text-[10px] text-netflix-muted">
                                {t("schedule.guess")}
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {unknown.length > 0 && (
            <section className="mt-10">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Hourglass className="h-5 w-5 text-netflix-muted" />
                {t("schedule.learning")}
              </h2>
              <p className="mb-3 text-xs text-netflix-muted">{t("schedule.learningHint")}</p>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {unknown.map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      to="/movie/$slug"
                      params={{ slug: entry.slug }}
                      className="flex items-center gap-3 rounded-lg bg-white/[0.03] p-2 hover:bg-white/5"
                    >
                      <MoviePosterImg
                        slug={entry.slug}
                        thumbUrl={entry.poster_url || entry.thumb_url}
                        alt=""
                        className="h-12 w-9 shrink-0 rounded object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">{entry.name}</p>
                        <p className="text-xs text-netflix-muted">
                          {entry.episode_current}
                          {entry.episode_total ? ` / ${entry.episode_total}` : ""}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
