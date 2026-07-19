import { useEffect, useState } from "react";
import type { Favorite } from "@/types/database";

export type FavoriteRow = Favorite;

export const PROFILE_TAB_IDS = ["overview", "favorites", "history"] as const;
export type ProfileTabId = (typeof PROFILE_TAB_IDS)[number];

const AVATAR_COLORS = [
  "from-rose-500 to-orange-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-fuchsia-500 to-purple-500",
  "from-amber-500 to-pink-500",
  "from-cyan-500 to-blue-500",
];

export function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function useCountUp(target: number, duration = 1000): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export { favoriteToMovieListItem as favToMovie } from "@/services/platform/favorites.service";

export function compareFavoritesNewest(
  a: Pick<FavoriteRow, "created_at">,
  b: Pick<FavoriteRow, "created_at">,
): number {
  const ta = a.created_at ? +new Date(a.created_at) : 0;
  const tb = b.created_at ? +new Date(b.created_at) : 0;
  return tb - ta;
}
