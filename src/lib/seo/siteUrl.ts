import { clientEnv } from "@/config/env";
import { TRAILING_SLASH_PATTERN } from "@/constants/patterns";

export function getSiteUrl(origin?: string): string {
  if (origin) return origin.replace(TRAILING_SLASH_PATTERN, "");
  if (typeof window !== "undefined") return window.location.origin;
  return clientEnv.siteUrl.replace(TRAILING_SLASH_PATTERN, "");
}
