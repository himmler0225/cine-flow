import { useState } from "react";
import { getImageCandidates } from "@/lib/movie/movieImages";
import { cn } from "@/lib/utils";

export function SearchThumb({ src, eager = false }: { src?: string; eager?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const candidates = getImageCandidates(src);
  const webp = candidates[0] ?? "";
  const fallback = candidates[1] ?? "";

  return (
    <div className="relative h-16 w-12 flex-none overflow-hidden rounded bg-white/5">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/5 to-white/10" />
      )}
      <img
        src={webp}
        alt=""
        width={48}
        height={64}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          const img = e.currentTarget;
          if (img.dataset.f !== "1" && fallback && fallback !== webp) {
            img.dataset.f = "1";
            img.src = fallback;
          } else {
            setLoaded(true);
          }
        }}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
