import { getImageUrl } from "@/lib/movie/movieImages";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { serializeJsonLd } from "@/lib/seo/jsonLd";
import { EXTERNAL_URLS } from "@/constants/urls";
import { stripHtml } from "@/utils/stripHtml";
import { t } from "@/lib/i18n";
import type { MovieDetail } from "@/types/movie";

export function buildMovieDetailHead(slug: string, movie: MovieDetail | null | undefined) {
  const url = `${getSiteUrl()}/movie/${slug}`;

  if (!movie) {
    return {
      meta: [
        { title: t("seo.detailFallbackTitle") },
        { name: "description", content: t("seo.detailFallbackDesc") },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  }

  const yearPart = movie.year ? ` (${movie.year})` : "";

  const title = t("seo.detailTitle", {
    name: movie.name,
    year: yearPart,
  });

  const description =
    stripHtml(movie.content) ||
    t("seo.detailDescription", {
      name: movie.name,
      origin: movie.origin_name ? ` (${movie.origin_name})` : "",
      quality: movie.quality ?? "HD",
      lang: movie.lang ?? "Vietsub",
    });

  const image = getImageUrl(movie.thumb_url || movie.poster_url);

  const primaryGenre = movie.category?.[0];

  const breadcrumb = {
    "@context": EXTERNAL_URLS.schemaContext,
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: getSiteUrl() },
      ...(primaryGenre
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: primaryGenre.name,
              item: `${getSiteUrl()}/genre/${primaryGenre.slug}`,
            },
            { "@type": "ListItem", position: 3, name: movie.name, item: url },
          ]
        : [{ "@type": "ListItem", position: 2, name: movie.name, item: url }]),
    ],
  };

  const movieLd: Record<string, unknown> = {
    "@context": EXTERNAL_URLS.schemaContext,
    "@type": "Movie",
    name: movie.name,
    alternateName: movie.origin_name,
    image,
    description,
    dateCreated: movie.year,
    inLanguage: movie.lang,
    genre: movie.category?.map((c) => c.name),
    actor: movie.actor?.filter(Boolean).map((a) => ({ "@type": "Person", name: a })),
    director: movie.director?.filter(Boolean).map((d) => ({ "@type": "Person", name: d })),
    countryOfOrigin: movie.country?.map((c) => ({ "@type": "Country", name: c.name })),
    duration: movie.time,
    contentRating: movie.quality,
    potentialAction: {
      "@type": "WatchAction",
      target: `${getSiteUrl()}/watch/${slug}`,
    },
    url,
  };

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: "video.movie" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      ...(image ? [{ property: "og:image", content: image }] : []),
      ...(image ? [{ name: "twitter:image", content: image }] : []),
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      { type: "application/ld+json", children: serializeJsonLd(movieLd) },
      { type: "application/ld+json", children: serializeJsonLd(breadcrumb) },
    ],
  };
}
