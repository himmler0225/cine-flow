import { platformFetch } from "@/lib/platformApi";

class AnalyticsApi {
  private async track<T>(path: string, body: T, auth = false): Promise<void> {
    try {
      await platformFetch(path, {
        method: "POST",
        body: JSON.stringify(body),
        auth,
      });
    } catch {}
  }
  trackPageView(pageType: string) {
    return this.track("/api/analytics/page-view", { page_type: pageType }, false);
  }
  trackSearch(keyword: string, resultsCount?: number, clickedSlug?: string) {
    return this.track(
      "/api/analytics/search",
      {
        keyword,
        results_count: resultsCount,
        clicked_slug: clickedSlug,
      },
      false,
    );
  }
  trackWatchEvent(input: {
    movieSlug: string;
    movieName?: string;
    thumbUrl?: string;
    episodeName?: string;
    serverName?: string;
    watchDurationSec?: number;
    completed?: boolean;
    lang?: string;
    quality?: string;
  }) {
    return this.track(
      "/api/analytics/watch-event",
      {
        movie_slug: input.movieSlug,
        movie_name: input.movieName,
        thumb_url: input.thumbUrl,
        episode_name: input.episodeName,
        server_name: input.serverName,
        watch_duration_sec: input.watchDurationSec,
        completed: input.completed,
        lang: input.lang,
        quality: input.quality,
      },
      true,
    );
  }
}

export const analyticsApi = new AnalyticsApi();

export function pageTypeFromPath(pathname: string): string {
  if (pathname === "/") return "home";

  if (pathname.startsWith("/movie/")) return "movie";

  if (pathname.startsWith("/watch/")) return "watch";

  if (pathname.startsWith("/search")) return "search";

  if (pathname.startsWith("/catalog/")) return "catalog";

  if (pathname.startsWith("/genre/")) return "genre";

  if (pathname.startsWith("/country/")) return "country";

  if (pathname.startsWith("/new")) return "new";

  if (pathname.startsWith("/admin")) return "admin";

  if (pathname.startsWith("/profile")) return "profile";

  return "other";
}
