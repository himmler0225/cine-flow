import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { useFavoritesList } from "@/hooks/useFavorites";
import { MovieCard } from "@/components/movie/MovieCard";
import { MoviePosterImg } from "@/components/movie/MoviePosterImg";
import { ProfileActivityFeed } from "@/components/profile/ProfileActivityFeed";
import { ProfileEmptyHint } from "@/components/profile/ProfileEmptyHint";
import {
  favToMovie,
  compareFavoritesNewest,
  type FavoriteRow,
} from "@/components/profile/profileUtils";
import { getWatchProgressPercent } from "@/utils/watchProgress";

export function ProfileOverviewTab() {
  const { t } = useTranslation();
  const { history } = useWatchHistory();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: favsAll = [] } = useFavoritesList(userId);

  const favs = useMemo<FavoriteRow[]>(
    () => [...favsAll].sort(compareFavoritesNewest).slice(0, 6),
    [favsAll],
  );

  const recent = useMemo(() => {
    const seen = new Set<string>();
    return history
      .filter((h) => {
        if (seen.has(h.movie_slug)) return false;
        seen.add(h.movie_slug);
        return true;
      })
      .slice(0, 6);
  }, [history]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">{t("profile.continueWatching")}</h2>
        {recent.length === 0 ? (
          <ProfileEmptyHint icon={<Clock className="h-8 w-8" />} text={t("profile.noInProgress")} />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recent.map((p) => {
              const pct = getWatchProgressPercent(p.progress_sec, p.duration_sec);
              const tap = p.episode_index !== undefined ? p.episode_index + 1 : 1;
              return (
                <Link
                  key={p.movie_slug}
                  to="/watch/$slug"
                  params={{ slug: p.movie_slug }}
                  search={{ tap, server: p.server_index }}
                  className="group relative flex-none"
                >
                  <div className="relative aspect-video w-60 overflow-hidden rounded-md bg-netflix-surface">
                    <MoviePosterImg
                      slug={p.movie_slug}
                      thumbUrl={p.thumb_url}
                      alt={p.movie_name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {p.episode_name}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="rounded-full bg-netflix-red px-3 py-1.5 text-xs font-semibold text-white">
                        ▶ {t("profile.continueWatching")}
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <p className="mb-1.5 line-clamp-1 text-sm font-medium text-white">
                        {p.movie_name}
                      </p>
                      {pct > 0 && (
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
                          <div
                            className="h-full rounded-full bg-netflix-red"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t("profile.recentFavorites")}</h2>
          <Link
            to="/profile"
            search={{ tab: "favorites" }}
            className="text-sm text-netflix-red hover:underline"
          >
            {t("profile.viewAll")}
          </Link>
        </div>
        {favs.length === 0 ? (
          <ProfileEmptyHint
            icon={<Heart className="h-8 w-8" />}
            text={t("profile.noRecentFavorites")}
          />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {favs.map((f) => (
              <MovieCard key={f.id} movie={favToMovie(f)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">{t("profile.activity")}</h2>
        <ProfileActivityFeed history={recent} favs={favs} />
      </section>
    </div>
  );
}
