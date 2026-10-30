import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Download, Share2, Sparkles } from "lucide-react";
import { MoviePosterImg } from "@/components/movie/MoviePosterImg";
import { seriesApi, type Wrapped } from "@/services/platform/series.service";
import { renderWrappedCard } from "@/lib/wrappedCard";
import { useAuthStore } from "@/store/authStore";
import { CACHE_TTL } from "@/constants/timing";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/wrapped")({
  head: () => ({
    meta: [{ title: t("wrapped.seoTitle") }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: WrappedPage,
});

function persona(w: Wrapped): string {
  const h = w.peak_hour;

  if (h == null) return "newbie";

  if (h >= 0 && h < 5) return "nightOwl";

  if (h >= 5 && h < 11) return "earlyBird";

  if (h >= 11 && h < 17) return "daytime";

  if (h >= 22) return "lateNight";

  return "evening";
}

function WrappedPage() {
  const { t, i18n } = useTranslation();

  const userId = useAuthStore((s) => (s.isAuthenticated ? s.user?.id : undefined));

  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);

  const [sharing, setSharing] = useState(false);

  const { data: w, isLoading } = useQuery({
    queryKey: ["wrapped", userId ?? "", year],
    queryFn: () => seriesApi.wrapped(year),
    enabled: !!userId,
    staleTime: CACHE_TTL.thirtyMinutes,
  });

  const hours = w ? Math.round(w.total_seconds / 360) / 10 : 0;

  const weekday = (d: number) =>
    // 2026-11-01 is a Sunday: offset from it for a localized weekday name.
    new Date(Date.UTC(2026, 10, 1 + d)).toLocaleDateString(i18n.language, {
      weekday: "long",
      timeZone: "UTC",
    });

  const share = async () => {
    if (!w) return;

    setSharing(true);

    try {
      const blob = await renderWrappedCard(w, {
        title: t("wrapped.cardTitle", { year: w.year }),
        hours: t("wrapped.hoursShort", { hours }),
        topTitle: t("wrapped.topTitles"),
        topGenres: t("wrapped.topGenres"),
        persona: t(`wrapped.persona.${persona(w)}`),
      });

      if (!blob) throw new Error("render failed");

      const file = new File([blob], `cineflow-${w.year}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t("wrapped.cardTitle", { year: w.year }) });
      } else {
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download = file.name;

        a.click();

        URL.revokeObjectURL(url);

        toast.success(t("wrapped.downloaded"));
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        toast.error(t("wrapped.shareFailed"));
    } finally {
      setSharing(false);
    }
  };

  const maxMonth = Math.max(1, ...(w?.by_month ?? [0]));

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white md:text-3xl">
          <Sparkles className="h-7 w-7 text-netflix-red" />
          {t("wrapped.title", { year })}
        </h1>
        <div className="flex gap-1">
          {[currentYear - 1, currentYear].map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                y === year ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20",
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !w ? (
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-white/5" />
      ) : w.episodes === 0 ? (
        <div className="mt-16 text-center text-netflix-muted">
          <p>{t("wrapped.empty", { year })}</p>
          <Link to="/" className="mt-2 inline-block text-netflix-red hover:underline">
            {t("movie.exploreMovies")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <section className="rounded-2xl bg-gradient-to-br from-netflix-red/80 via-red-950 to-black p-6 md:p-10">
            <p className="text-sm uppercase tracking-widest text-white/70">
              {t("wrapped.youWatched")}
            </p>
            <p className="mt-2 text-6xl font-black text-white md:text-8xl">
              {t("wrapped.hoursShort", { hours })}
            </p>
            <p className="mt-3 text-lg font-semibold text-red-200">
              {t(`wrapped.persona.${persona(w)}`)}
            </p>
            <button
              type="button"
              disabled={sharing}
              onClick={() => void share()}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
            >
              {typeof navigator !== "undefined" && "share" in navigator ? (
                <Share2 className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t("wrapped.share")}
            </button>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              [t("wrapped.episodes"), w.episodes],
              [t("wrapped.titles"), w.titles],
              [t("wrapped.activeDays"), w.active_days],
              [t("wrapped.streak"), t("wrapped.days", { count: w.longest_streak_days })],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-white/[0.04] p-4">
                <p className="text-xs text-netflix-muted">{label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-xl bg-white/[0.04] p-4">
            <h2 className="mb-3 font-semibold text-white">{t("wrapped.topTitles")}</h2>
            <ol className="space-y-2">
              {w.top_titles.map((m, i) => (
                <li key={m.slug}>
                  <Link
                    to="/movie/$slug"
                    params={{ slug: m.slug }}
                    className="flex items-center gap-3 rounded-lg p-1 hover:bg-white/5"
                  >
                    <span className="w-6 text-center text-xl font-black text-netflix-red">
                      {i + 1}
                    </span>
                    <MoviePosterImg
                      slug={m.slug}
                      thumbUrl={m.thumb_url ?? undefined}
                      alt=""
                      className="h-14 w-10 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{m.name}</p>
                      <p className="text-xs text-netflix-muted">
                        {t("wrapped.titleStats", {
                          hours: Math.round(m.seconds / 360) / 10,
                          count: m.episodes,
                        })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-white/[0.04] p-4">
              <h2 className="mb-3 font-semibold text-white">{t("wrapped.topGenres")}</h2>
              <div className="flex flex-wrap gap-2">
                {[...w.top_genres, ...w.top_countries].map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-netflix-red/20 px-3 py-1 text-sm text-red-100"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-4 text-sm text-white/90">
              <h2 className="mb-3 font-semibold text-white">{t("wrapped.habits")}</h2>
              {w.peak_hour != null && <p>{t("wrapped.peakHour", { hour: w.peak_hour })}</p>}
              {w.peak_weekday != null && (
                <p>{t("wrapped.peakWeekday", { day: weekday(w.peak_weekday) })}</p>
              )}
              <p className="mt-2 text-netflix-muted">
                {t("wrapped.activity", {
                  comments: w.comments + w.danmaku,
                  ratings: w.ratings,
                  favorites: w.favorites_added,
                })}
              </p>
            </div>
          </section>

          <section className="rounded-xl bg-white/[0.04] p-4">
            <h2 className="mb-4 font-semibold text-white">{t("wrapped.byMonth")}</h2>
            <div className="flex h-32 items-end gap-1.5">
              {w.by_month.map((s, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-netflix-red/80"
                      style={{ height: `${Math.max(2, (s / maxMonth) * 100)}%` }}
                      title={`${Math.round(s / 3600)}h`}
                    />
                  </div>
                  <span className="text-[10px] text-netflix-muted">{i + 1}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
