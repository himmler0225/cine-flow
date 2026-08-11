import { toast } from "sonner";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { t } from "@/lib/i18n";

export function buildMovieShareUrl(slug: string) {
  return `${getSiteUrl()}/movie/${slug}`;
}

export function buildWatchShareUrl(slug: string, tap = 1, server = 0) {
  const url = new URL(`${getSiteUrl()}/watch/${slug}`);

  if (tap > 1) url.searchParams.set("tap", String(tap));

  if (server > 0) url.searchParams.set("server", String(server));

  return url.toString();
}

export async function copyText(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);

    toast.success(label);
  } catch {
    toast.error(t("toast.copyFailed"));
  }
}

export async function copyMovieLink(slug: string, movieName?: string) {
  const text = movieName
    ? t("seo.shareMovieText", { movie: movieName, url: buildMovieShareUrl(slug) })
    : buildMovieShareUrl(slug);

  await copyText(t("toast.copyMovieLink"), text);
}
