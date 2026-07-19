import { z } from "zod";
import { DEFAULT_URLS } from "@/constants/urls";

const optionalHttpUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : undefined),
  z
    .string()
    .url()
    .refine((value) => /^https?:\/\//.test(value), "Expected an HTTP(S) URL")
    .optional(),
);

const clientEnvSchema = z.object({
  VITE_MOVIE_API_URL: optionalHttpUrlSchema,
  VITE_SITE_URL: optionalHttpUrlSchema,
});

const rawMovieApiUrl = import.meta.env.VITE_MOVIE_API_URL?.trim();
const rawSiteUrl = import.meta.env.VITE_SITE_URL?.trim();

/** Client-safe Vite configuration; never add server secrets to this module. */
export const clientEnv = Object.freeze({
  movieApiUrl: rawMovieApiUrl || DEFAULT_URLS.movieApi,
  siteUrl: rawSiteUrl || DEFAULT_URLS.site,
  rawMovieApiUrl,
  rawSiteUrl,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
});

/** Validation result is exposed so the existing startup warning UI can report bad config. */
export const clientEnvValidation = clientEnvSchema.safeParse({
  VITE_MOVIE_API_URL: rawMovieApiUrl,
  VITE_SITE_URL: rawSiteUrl,
});

export function isValidHttpUrl(value: string | undefined): boolean {
  return Boolean(value && optionalHttpUrlSchema.safeParse(value).success);
}
