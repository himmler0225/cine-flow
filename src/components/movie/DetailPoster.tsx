import { useMemo, useState } from "react";
import { Film } from "lucide-react";
import { getImageCandidates } from "@/lib/movie/movieImages";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settingsStore";
import { useHydrated } from "@/hooks/useHydrated";

function buildPosterCandidates(poster?: string, thumb?: string, dataSaver = false): string[] {
  const raw = [poster, thumb].filter(Boolean) as string[];

  const out: string[] = [];

  for (const r of raw) {
    for (const candidate of getImageCandidates(r, { skipWebp: dataSaver })) {
      if (!out.includes(candidate)) out.push(candidate);
    }
  }

  return out;
}

interface DetailPosterProps {
  poster?: string;
  thumb?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  variant?: "poster" | "backdrop";
}

export function DetailPoster({
  poster,
  thumb,
  alt,
  className,
  priority = false,
  variant = "poster",
}: DetailPosterProps) {
  const hydrated = useHydrated();

  const dataSaver = useSettingsStore((s) => s.dataSaver) && hydrated;

  const candidates = useMemo(
    () =>
      variant === "backdrop"
        ? buildPosterCandidates(thumb || poster, poster, dataSaver)
        : buildPosterCandidates(poster, thumb, dataSaver),
    [poster, thumb, variant, dataSaver],
  );

  const [idx, setIdx] = useState(0);

  const src = candidates[idx] ?? "";

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-netflix-surface to-black/80 text-white/30",
          className,
        )}
        aria-hidden
      >
        <Film className="h-12 w-12" />
      </div>
    );
  }

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => {
        if (idx + 1 < candidates.length) setIdx((i) => i + 1);
      }}
    />
  );
}
