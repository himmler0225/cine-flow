import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { useEpisodeNotifications } from "@/hooks/useEpisodeNotifications";
import { MoviePosterImg } from "@/components/movie/MoviePosterImg";

export function NotificationBell() {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const { notifications, unreadCount, markRead } = useEpisodeNotifications();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);

          if (!open) markRead();
        }}
        className="relative rounded-full p-2 text-white hover:bg-white/10"
        aria-label={t("notifications.bellAria")}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-netflix-red px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label={t("notifications.closeAria")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-white/10 bg-netflix-dark shadow-2xl">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-white">{t("notifications.newEpisodes")}</p>
              <p className="text-xs text-netflix-muted">{t("notifications.favoritesUpdate")}</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-netflix-muted">
                  {t("notifications.emptyHint")}
                </p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <Link
                        to="/watch/$slug"
                        params={{ slug: n.slug }}
                        search={{ tap: 1, server: 0, fromStart: false }}
                        onClick={() => setOpen(false)}
                        className="flex gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                      >
                        <MoviePosterImg
                          slug={n.slug}
                          thumbUrl={n.thumb_url}
                          alt=""
                          className="h-14 w-10 shrink-0 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium text-white">{n.name}</p>
                          <p className="text-xs text-netflix-red">
                            {n.oldEpisode} → {n.newEpisode}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
