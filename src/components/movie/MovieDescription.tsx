import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const COLLAPSED_MAX_PX = 72;

interface Props {
  html: string;
  className?: string;
}

export function MovieDescription({ html, className }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const measureRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    setCanExpand(el.scrollHeight > COLLAPSED_MAX_PX + 4);
  }, [html]);
  return (
    <div className={cn("mt-5 max-w-3xl", className)}>
      <div className="relative">
        <div
          ref={measureRef}
          className={cn(
            "prose-invert text-sm leading-relaxed text-netflix-text/90 [&_p]:mb-2 [&_p:last-child]:mb-0",
            !expanded && canExpand && "max-h-[72px] overflow-hidden",
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {!expanded && canExpand && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-netflix-black to-transparent"
          />
        )}
      </div>

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-netflix-red transition-colors hover:text-netflix-red-hover"
        >
          {expanded ? t("movie.showLess") : t("movie.seeMore")}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
