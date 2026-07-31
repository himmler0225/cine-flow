import { useEffect, useMemo, useState } from "react";
import { getImageCandidates, isLikelyImageUrl } from "@/lib/movie/movieImages";
import { CACHE_TTL } from "@/constants/timing";
import { useMovieDetail } from "@/hooks/useMovieDetail";
import { cn } from "@/lib/utils";

interface MoviePosterImgProps {
  slug: string;
  thumbUrl?: string | null;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export function MoviePosterImg({
  slug,
  thumbUrl,
  alt = "",
  className,
  loading = "lazy",
}: MoviePosterImgProps) {
  const stored = isLikelyImageUrl(thumbUrl) ? thumbUrl!.trim() : "";
  const [useApi, setUseApi] = useState(!stored);
  const [idx, setIdx] = useState(0);
  const { data: fetched } = useMovieDetail(slug, {
    enabled: useApi,
    staleTime: CACHE_TTL.fiveMinutes,
    select: (detail) => detail.movie.poster_url || detail.movie.thumb_url || "",
  });
  const rawPoster = useApi ? (fetched ?? "") : stored;
  const candidates = useMemo(() => getImageCandidates(rawPoster), [rawPoster]);
  useEffect(() => {
    setIdx(0);
  }, [rawPoster]);
  const src = candidates[idx] ?? "";
  const handleError = () => {
    if (idx + 1 < candidates.length) {
      setIdx((i) => i + 1);
      return;
    }
    if (!useApi) {
      setUseApi(true);
      setIdx(0);
    }
  };
  if (useApi && !fetched && !stored) {
    return <div className={cn("animate-pulse bg-netflix-surface", className)} aria-hidden />;
  }
  if (!src) {
    return <div className={cn("bg-netflix-surface", className)} aria-hidden />;
  }
  return (
    <img
      key={src}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onError={handleError}
    />
  );
}
