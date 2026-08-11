import { TRAILING_SLASH_PATTERN } from "@/constants/patterns";
import { clientEnv } from "@/config/env";

export const MOVIE_API_BASE_URL = clientEnv.movieApiUrl.replace(TRAILING_SLASH_PATTERN, "");

export const MOVIE_API_PREFIX = "/api/movies";

export function movieApiUrl(
  path: string,
  params?: Record<string, string | number | undefined>,
): string {
  const url = new URL(`${MOVIE_API_BASE_URL}${MOVIE_API_PREFIX}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}
