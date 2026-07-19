import type { MovieListItem } from "@/types/movie";
import { MovieCard } from "./MovieCard";

interface Props {
  movies: MovieListItem[];
  isLoading?: boolean;
}

export function MovieGrid({ movies, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 items-start gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 md:gap-4 md:px-12 lg:grid-cols-5 xl:grid-cols-6">
      {isLoading
        ? Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] animate-pulse rounded-md bg-netflix-surface"
              aria-hidden="true"
            />
          ))
        : movies.map((m, i) => <MovieCard key={m.slug} movie={m} priority={i < 4} />)}
    </div>
  );
}
