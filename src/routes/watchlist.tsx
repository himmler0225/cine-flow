import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ProfileWatchlistsTab } from "@/components/profile/ProfileWatchlistsTab";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [{ title: t("seo.watchlistTitle") }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { t } = useTranslation();
  return (
    <div className="bg-netflix-black pt-24 pb-4 md:pb-8">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {t("movie.watchlistTitle")}
            </h1>
            <p className="mt-1 text-sm text-netflix-muted">{t("movie.watchlistLocalDesc")}</p>
          </div>
          <Link to="/" className="text-sm text-netflix-red hover:underline">
            {t("movie.exploreMoviesBack")}
          </Link>
        </div>
        <ProfileWatchlistsTab />
      </div>
    </div>
  );
}
