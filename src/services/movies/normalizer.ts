import type {
  DetailResponse,
  MovieDetail,
  MovieListItem,
  MovieListResult,
  PaginationMeta,
} from "@/types/movie";

export type MovieSource = "kkphim" | "ophim" | "vsmov";

export interface AggregatorEnvelope<T> {
  source: MovieSource;
  data: T;
  pagination?: PaginationMeta;
}

export class MovieNotFoundError extends Error {
  constructor(msg = "Movie not found") {
    super(msg);

    this.name = "MovieNotFoundError";
  }
}

export function toListResult(envelope: AggregatorEnvelope<MovieListItem[]>): MovieListResult {
  return {
    items: envelope.data ?? [],
    pagination: envelope.pagination,
  };
}

export function toDetailResponse(
  envelope: AggregatorEnvelope<{
    movie: MovieDetail;
    episodes: DetailResponse["episodes"];
  }>,
): DetailResponse {
  if (!envelope.data?.movie?.slug) {
    throw new MovieNotFoundError();
  }

  return {
    movie: envelope.data.movie,
    episodes: envelope.data.episodes ?? [],
  };
}

export function toMetadataList<T>(envelope: AggregatorEnvelope<T[]>): T[] {
  return envelope.data;
}
