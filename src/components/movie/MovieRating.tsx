import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useMovieRating } from "@/hooks/useMovieRating";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

interface MovieRatingProps {
  slug: string;
  compact?: boolean;
}

export function MovieRating({ slug, compact }: MovieRatingProps) {
  const { t } = useTranslation();
  const { average, count, userScore, rate, isSubmitting } = useMovieRating(slug);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hover, setHover] = useState(0);
  const display = hover || userScore || 0;
  const handleRate = async (score: number) => {
    try {
      await rate(score);
      toast.success(t("toast.rated", { score }));
    } catch (e) {
      if ((e as Error).message === "RATINGS_UNAVAILABLE") {
        toast.error(t("toast.ratingUnavailable"));
      }
    }
  };
  if (!isAuthenticated) {
    const rounded = Math.round(average);
    return (
      <div className={cn("flex flex-wrap items-center gap-2", compact && "gap-1.5")}>
        <div className="flex items-center" role="img" aria-label={t("movie.rateMovieAria")}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                compact ? "h-4 w-4" : "h-5 w-5",
                i < rounded ? "fill-amber-400 text-amber-400" : "text-white/25",
              )}
            />
          ))}
        </div>
        {count > 0 && (
          <span className={cn("text-netflix-muted", compact ? "text-xs" : "text-sm")}>
            {average.toFixed(1)} ({count})
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact && "gap-1.5")}>
      <div
        className="flex items-center"
        onMouseLeave={() => setHover(0)}
        role="group"
        aria-label={t("movie.rateMovieAria")}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const star = i + 1;
          const filled = star <= display;
          return (
            <button
              key={star}
              type="button"
              disabled={isSubmitting}
              onMouseEnter={() => setHover(star)}
              onClick={() => handleRate(star)}
              className={cn(
                "p-0.5 transition-colors disabled:opacity-50",
                compact ? "p-0" : "p-0.5",
              )}
              aria-label={t("movie.starAria", { star })}
            >
              <Star
                className={cn(
                  compact ? "h-4 w-4" : "h-5 w-5",
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : "text-white/25 hover:text-amber-400/60",
                )}
              />
            </button>
          );
        })}
      </div>
      {count > 0 && (
        <span className={cn("text-netflix-muted", compact ? "text-xs" : "text-sm")}>
          {average.toFixed(1)} ({count})
        </span>
      )}
      {userScore != null && (
        <span className={cn("text-amber-400/80", compact ? "text-[10px]" : "text-xs")}>
          {t("movie.yourRating", { score: userScore })}
        </span>
      )}
    </div>
  );
}
