import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Heart, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MoviePosterImg } from "@/components/movie/MoviePosterImg";
import { ProfileEmptyHint } from "@/components/profile/ProfileEmptyHint";
import type { FavoriteRow } from "@/components/profile/profileUtils";
import type { WatchHistoryItem } from "@/hooks/user/useWatchHistory";
import { formatRelativeTime } from "@/lib/i18n";

interface ProfileActivityFeedProps {
  history: WatchHistoryItem[];
  favs: FavoriteRow[];
}

export function ProfileActivityFeed({ history, favs }: ProfileActivityFeedProps) {
  const { t, i18n } = useTranslation();
  const events = useMemo(() => {
    const items: {
      kind: "watch" | "fav";
      ts: number;
      title: string;
      poster: string;
      slug: string;
    }[] = [];
    history.forEach((h) =>
      items.push({
        kind: "watch",
        ts: new Date(h.watched_at).getTime(),
        title: t("profile.activityWatched", {
          episode: h.episode_name,
          movie: h.movie_name,
        }),
        poster: h.thumb_url || "",
        slug: h.movie_slug,
      }),
    );
    favs.forEach((f) =>
      items.push({
        kind: "fav",
        ts: f.created_at ? new Date(f.created_at).getTime() : 0,
        title: t("profile.activityFavorited", { movie: f.movie_name }),
        poster: f.thumb_url || "",
        slug: f.movie_slug,
      }),
    );
    return items.sort((a, b) => b.ts - a.ts).slice(0, 10);
  }, [history, favs, t]);
  if (events.length === 0) {
    return <ProfileEmptyHint icon={<Clock className="h-8 w-8" />} text={t("profile.noActivity")} />;
  }
  return (
    <ul className="space-y-2">
      {events.map((e, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 p-3"
        >
          <Link to="/movie/$slug" params={{ slug: e.slug }} className="shrink-0">
            <MoviePosterImg
              slug={e.slug}
              thumbUrl={e.poster}
              alt=""
              className="h-12 w-9 rounded object-cover"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm text-white">{e.title}</p>
            <p className="text-xs text-netflix-muted">{formatRelativeTime(e.ts, i18n.language)}</p>
          </div>
          {e.kind === "fav" ? (
            <Heart className="h-4 w-4 text-netflix-red" />
          ) : (
            <Play className="h-4 w-4 text-netflix-muted" />
          )}
        </li>
      ))}
    </ul>
  );
}
