import { cn } from "@/lib/utils";

export function qualityBadgeClass(quality?: string): string {
  const v = (quality || "").toUpperCase();
  if (v === "CAM" || v === "TS" || v === "SD") return "bg-netflix-red text-white";
  if (v === "4K" || v === "FHD") return "bg-amber-400 text-black";
  if (v === "HD") return "bg-amber-300/90 text-black";
  return "bg-white/90 text-black";
}

export function langBadgeClass(_lang?: string): string {
  return "bg-white/10 text-white/90";
}

type MetaBadgesProps = {
  quality?: string;
  lang?: string;
  year?: number | string;
  episode?: string;
  className?: string;
  size?: "sm" | "md";
};

export function MetaBadges({
  quality,
  lang,
  year,
  episode,
  className,
  size = "md",
}: MetaBadgesProps) {
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {quality && (
        <span className={cn("rounded font-bold tracking-wide", pad, qualityBadgeClass(quality))}>
          {quality}
        </span>
      )}
      {lang && (
        <span className={cn("rounded font-semibold tracking-wide", pad, langBadgeClass(lang))}>
          {lang}
        </span>
      )}
      {year != null && year !== "" && (
        <span className={cn("text-netflix-muted", size === "sm" ? "text-[10px]" : "text-sm")}>
          {year}
        </span>
      )}
      {episode && (
        <span
          className={cn(
            "rounded bg-white/10 text-netflix-muted",
            pad,
            size === "sm" && "font-semibold text-white",
          )}
        >
          {episode}
        </span>
      )}
    </div>
  );
}
