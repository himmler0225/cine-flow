import { Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { copyMovieLink } from "@/lib/seo/share";
import { movieActionButtonVariants } from "@/components/movie/movieActionButton";

interface ShareButtonProps {
  slug: string;
  movieName: string;
  className?: string;
  variant?: "hero" | "compact";
}

export function ShareButton({ slug, movieName, className, variant = "hero" }: ShareButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => void copyMovieLink(slug, movieName)}
      className={cn(
        variant === "hero"
          ? movieActionButtonVariants({ intent: "secondary" })
          : "inline-flex items-center gap-2 rounded p-2 font-semibold text-white transition-colors hover:bg-white/10",
        className,
      )}
      aria-label={t("movie.shareAria")}
      title={t("movie.shareTitle")}
    >
      <Share2 className={variant === "hero" ? "h-5 w-5" : "h-4 w-4"} />
      {variant === "hero" && t("movie.share")}
    </button>
  );
}
