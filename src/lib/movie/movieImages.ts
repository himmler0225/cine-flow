import { MOVIE_API_BASE_URL } from "@/lib/movie/movieApi";
import {
  HAS_WHITESPACE_PATTERN,
  IMAGE_EXTENSION_PATTERN,
  LEADING_SLASH_PATTERN,
  UPLOAD_PATH_PATTERN,
} from "@/constants/patterns";
import { MOVIE_IMAGE_URLS } from "@/constants/urls";

/** Kiểm tra chuỗi có phải URL/path ảnh hợp lệ (không phải tên phim). */
export const isLikelyImageUrl = (url?: string | null): boolean => {
  if (!url?.trim()) return false;
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("//")) return true;
  if (IMAGE_EXTENSION_PATTERN.test(u)) return true;
  if (UPLOAD_PATH_PATTERN.test(u) || u.includes("/upload")) return true;
  if (HAS_WHITESPACE_PATTERN.test(u) && !u.includes("/")) return false;
  return u.includes("/");
};

/** BE trả absolute URL; giữ fallback cho dữ liệu legacy (favorites cũ). */
export const getImageUrl = (url?: string): string => {
  if (!url?.trim()) return "";
  const u = url.trim();
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const clean = u.replace(LEADING_SLASH_PATTERN, "");
  if (clean.startsWith("uploads/") || clean.includes("ophim")) {
    return `${MOVIE_IMAGE_URLS.ophim}${clean}`;
  }
  return MOVIE_IMAGE_URLS.kkphim + clean;
};

/** WebP proxy qua movie-aggregator-api (chỉ phimimg.com). */
export const getImageWebp = (url?: string): string => {
  const abs = getImageUrl(url);
  if (!abs) return "";
  if (!abs.includes("phimimg.com")) return abs;
  const proxy = new URL(`${MOVIE_API_BASE_URL}/api/movies/image/webp`);
  proxy.searchParams.set("url", abs);
  return proxy.toString();
};

/** Ordered WebP → original candidates for a single raw image URL. */
export const getImageCandidates = (
  url?: string | null,
  options: { skipWebp?: boolean } = {},
): string[] => {
  const orig = getImageUrl(url ?? undefined);
  if (!orig) return [];
  if (options.skipWebp) return [orig];
  const webp = getImageWebp(url ?? undefined);
  return webp && webp !== orig ? [webp, orig] : [orig];
};
