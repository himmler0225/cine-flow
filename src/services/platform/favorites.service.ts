import { platformFetch } from "@/lib/platformApi";
import { getImageUrl } from "@/lib/movie/movieImages";
import { useFavoriteStore } from "@/store/favoriteStore";
import type { Favorite, FavoriteSlug, InsertFavoriteInput } from "@/types/database";
import type { MovieListItem } from "@/types/movie";

export function favoriteToMovieListItem(f: {
  movie_slug: string;
  movie_name: string;
  thumb_url?: string | null;
}): MovieListItem {
  const thumb = f.thumb_url ?? "";
  return {
    slug: f.movie_slug,
    name: f.movie_name,
    poster_url: thumb,
    thumb_url: thumb,
  };
}

class FavoritesApi {
  async fetchSlugs(): Promise<Map<string, string>> {
    const rows = await platformFetch<FavoriteSlug[]>(`/api/favorites/slugs`);
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.movie_slug, r.id));
    return map;
  }
  async remove(id: string) {
    await platformFetch(`/api/favorites/${id}`, { method: "DELETE" });
    return { error: null };
  }
  async insert(input: InsertFavoriteInput) {
    const data = await platformFetch<{
      id: string;
    }>("/api/favorites", {
      method: "POST",
      body: JSON.stringify({
        movie_slug: input.movieSlug,
        movie_name: input.movieName,
        thumb_url: input.thumbUrl,
      }),
    });
    return { data, error: null };
  }
  fetchList(): Promise<Favorite[]> {
    return platformFetch<Favorite[]>("/api/favorites");
  }
  async removeBySlug(movieSlug: string) {
    await platformFetch(`/api/favorites/slug/${encodeURIComponent(movieSlug)}`, {
      method: "DELETE",
    });
    return { error: null };
  }
  count(): Promise<number> {
    return platformFetch<number>("/api/favorites/count");
  }
  async migrateLocalToServer(): Promise<void> {
    const local = useFavoriteStore.getState().favorites;
    if (local.length === 0) return;
    try {
      const existing = await this.fetchSlugs();
      const toInsert = local.filter((m) => !existing.has(m.slug));
      if (toInsert.length === 0) {
        useFavoriteStore.getState().clearAll();
        return;
      }
      await platformFetch("/api/favorites/batch", {
        method: "POST",
        body: JSON.stringify({
          items: toInsert.map((m) => ({
            movie_slug: m.slug,
            movie_name: m.name,
            thumb_url: getImageUrl(m.poster_url || m.thumb_url) || null,
          })),
        }),
      });
      useFavoriteStore.getState().clearAll();
    } catch (e) {
      console.error("[favorites] migration failed", e);
    }
  }
}

export const favoritesApi = new FavoritesApi();
