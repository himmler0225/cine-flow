import type { MovieListItem } from "@/types/movie";
import { getImageUrl } from "@/lib/movie/movieImages";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { EXTERNAL_URLS } from "@/constants/urls";

export function buildListingHead(opts: { title: string; description: string; path: string }) {
  const url = `${getSiteUrl()}${opts.path}`;

  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.description },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.description },
      { property: "og:url", content: url },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export const buildItemListJsonLd = (
  items: MovieListItem[],
  opts: {
    name: string;
    url: string;
    max?: number;
  },
) => {
  const max = opts.max ?? 20;

  return {
    "@context": EXTERNAL_URLS.schemaContext,
    "@type": "ItemList",
    name: opts.name,
    url: opts.url.startsWith("http") ? opts.url : `${getSiteUrl()}${opts.url}`,
    numberOfItems: Math.min(items.length, max),
    itemListElement: items.slice(0, max).map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${getSiteUrl()}/movie/${m.slug}`,
      name: m.name,
      image: getImageUrl(m.poster_url || m.thumb_url) || undefined,
    })),
  };
};
