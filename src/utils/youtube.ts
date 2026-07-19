import { YOUTUBE_URL_PATTERN } from "@/constants/patterns";
import { EXTERNAL_URLS } from "@/constants/urls";

export function getYoutubeEmbed(url: string): string | null {
  const m = url.match(YOUTUBE_URL_PATTERN);
  return m ? `${EXTERNAL_URLS.youtubeEmbed}${m[1]}` : null;
}
