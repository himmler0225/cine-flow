export const DEFAULT_URLS = {
  movieApi: "http://localhost:3001",
  site: "http://localhost:5173",
} as const;

export const EXTERNAL_URLS = {
  schemaContext: "https://schema.org",
  sitemapNamespace: "http://www.sitemaps.org/schemas/sitemap/0.9",
  youtubeEmbed: "https://www.youtube.com/embed/",
  googleFontsApi: "https://fonts.googleapis.com",
  googleFontsStatic: "https://fonts.gstatic.com",
  interFontCss:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
  github: "https://github.com",
  twitter: "https://twitter.com",
} as const;

export const MOVIE_IMAGE_URLS = {
  kkphim: "https://phimimg.com/",
  ophim: "https://img.ophim.live/uploads/movies/",
  vsmov: "https://vsmov.com/",
} as const;

export const MOVIE_IMAGE_ORIGINS = [
  "https://phimimg.com",
  "https://img.ophim.live",
  "https://vsmov.com",
] as const;
