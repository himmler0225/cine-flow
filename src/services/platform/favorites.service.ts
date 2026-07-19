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

export async function fetchFavoriteSlugs(userId: string): Promise<Map<string, string>> {
  const rows = await platformFetch<FavoriteSlug[]>(`/api/favorites/slugs`);
  const map = new Map<string, string>();
  rows.forEach((r) => map.set(r.movie_slug, r.id));
  return map;
}

export async function deleteFavorite(id: string) {
  await platformFetch(`/api/favorites/${id}`, { method: "DELETE" });
  return { error: null };
}

export async function insertFavorite(input: InsertFavoriteInput) {
  const data = await platformFetch<{ id: string }>("/api/favorites", {
    method: "POST",
    body: JSON.stringify({
      movie_slug: input.movieSlug,
      movie_name: input.movieName,
      thumb_url: input.thumbUrl,
    }),
  });
  return { data, error: null };
}

export async function fetchFavoritesList(_userId: string): Promise<Favorite[]> {
  return platformFetch<Favorite[]>("/api/favorites");
}

export async function deleteFavoriteBySlug(_userId: string, movieSlug: string) {
  await platformFetch(`/api/favorites/slug/${encodeURIComponent(movieSlug)}`, {
    method: "DELETE",
  });
  return { error: null };
}

export async function countFavorites(_userId: string): Promise<number> {
  return platformFetch<number>("/api/favorites/count");
}

export async function migrateLocalFavoritesToSupabase(userId: string): Promise<void> {
  const local = useFavoriteStore.getState().favorites;
  if (local.length === 0) return;

  try {
    const existing = await fetchFavoriteSlugs(userId);
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
