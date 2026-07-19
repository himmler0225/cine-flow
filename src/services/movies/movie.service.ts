import { AxiosError } from "axios";
import { clientEnv } from "@/config/env";
import { movieApiClient } from "@/lib/http/movieApiClient";
import { MOVIE_API_PREFIX } from "@/lib/movie/movieApi";
import { t } from "@/lib/i18n";
import {
  MovieNotFoundError,
  toDetailResponse,
  toListResult,
  toMetadataList,
  type AggregatorEnvelope,
} from "./normalizer";
import type { DetailResponse, MovieDetail, MovieListItem, MovieListResult } from "@/types/movie";

export type MovieFilterParams = {
  category?: string;
  country?: string;
  year?: string | number;
  sort_lang?: string;
  sort_field?: string;
  sort_type?: string;
};

const TIMEOUT = {
  list: 8000,
  detail: 10000,
  search: 6000,
  meta: 8000,
} as const;

const cleanParams = (o: MovieFilterParams = {}) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ""));

async function fetchAggregator<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  ms: number = TIMEOUT.list,
): Promise<T> {
  try {
    const { data } = await movieApiClient.get<T>(`${MOVIE_API_PREFIX}${path}`, {
      params: params ? cleanParams(params) : undefined,
      timeout: ms,
      skipAuth: true,
    });
    return data;
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 404) {
      const body = err.response.data as { error?: string } | undefined;
      throw new MovieNotFoundError(body?.error || "Movie not found");
    }
    if (err instanceof MovieNotFoundError) throw err;
    if (clientEnv.isDevelopment) {
      console.error("[MovieService]", path, err);
    }
    throw new Error(t("errors.dataLoadFailed"));
  }
}

export const movieService = {
  getNewMovies: async (page = 1): Promise<MovieListResult> => {
    const envelope = await fetchAggregator<AggregatorEnvelope<MovieListItem[]>>(
      "/new",
      { page },
      TIMEOUT.list,
    );
    return toListResult(envelope);
  },

  getMoviesByType: async (
    type: string,
    page = 1,
    extra: MovieFilterParams = {},
  ): Promise<MovieListResult> => {
    const envelope = await fetchAggregator<AggregatorEnvelope<MovieListItem[]>>(
      `/type/${encodeURIComponent(type)}`,
      { page, limit: 24, ...cleanParams(extra) },
      TIMEOUT.list,
    );
    return toListResult(envelope);
  },

  getMovieDetail: async (slug: string): Promise<DetailResponse> => {
    const envelope = await fetchAggregator<
      AggregatorEnvelope<{ movie: MovieDetail; episodes: DetailResponse["episodes"] }>
    >(`/${encodeURIComponent(slug)}`, undefined, TIMEOUT.detail);
    return toDetailResponse(envelope);
  },

  searchMovies: async (keyword: string, page = 1): Promise<MovieListResult> => {
    const envelope = await fetchAggregator<AggregatorEnvelope<MovieListItem[]>>(
      "/search",
      { keyword, page, limit: 24 },
      TIMEOUT.search,
    );
    return toListResult(envelope);
  },

  getByGenre: async (
    slug: string,
    page = 1,
    extra: MovieFilterParams = {},
  ): Promise<MovieListResult> => {
    const envelope = await fetchAggregator<AggregatorEnvelope<MovieListItem[]>>(
      `/genres/${encodeURIComponent(slug)}`,
      { page, limit: 24, ...cleanParams(extra) },
      TIMEOUT.list,
    );
    return toListResult(envelope);
  },

  getByCountry: async (
    slug: string,
    page = 1,
    extra: MovieFilterParams = {},
  ): Promise<MovieListResult> => {
    const envelope = await fetchAggregator<AggregatorEnvelope<MovieListItem[]>>(
      `/countries/${encodeURIComponent(slug)}`,
      { page, limit: 24, ...cleanParams(extra) },
      TIMEOUT.list,
    );
    return toListResult(envelope);
  },

  getByYear: async (
    year: number,
    page = 1,
    extra: MovieFilterParams = {},
  ): Promise<MovieListResult> => {
    const envelope = await fetchAggregator<AggregatorEnvelope<MovieListItem[]>>(
      `/years/${year}`,
      { page, limit: 24, ...cleanParams(extra) },
      TIMEOUT.list,
    );
    return toListResult(envelope);
  },
};

export const genreService = {
  getAll: async () => {
    const envelope = await fetchAggregator<
      AggregatorEnvelope<Array<{ _id: string; name: string; slug: string }>>
    >("/meta/genres", undefined, TIMEOUT.meta);
    return toMetadataList(envelope);
  },
};

export const countryService = {
  getAll: async () => {
    const envelope = await fetchAggregator<
      AggregatorEnvelope<Array<{ _id: string; name: string; slug: string }>>
    >("/meta/countries", undefined, TIMEOUT.meta);
    return toMetadataList(envelope);
  },
};
