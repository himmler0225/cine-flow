import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
};

function getRange(page: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const out: Array<number | "..."> = [1];

  const start = Math.max(2, page - 1);

  const end = Math.min(total - 1, page + 1);

  if (start > 2) out.push("...");

  for (let i = start; i <= end; i++) out.push(i);

  if (end < total - 1) out.push("...");

  out.push(total);

  return out;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  const { t } = useTranslation();

  if (!totalPages || totalPages < 2) return null;

  const items = getRange(page, totalPages);

  const canGoPrev = page > 1;

  const canGoNext = page < totalPages;

  return (
    <nav
      aria-label={t("filters.pagination")}
      className="mt-4 flex flex-wrap items-center justify-center gap-1 pb-2 md:mt-6"
    >
      {canGoPrev ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-white hover:bg-white/10"
          onClick={() => onChange(page - 1)}
          aria-label={t("filters.prevPage")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      ) : null}

      {items.map((it, i) =>
        it === "..." ? (
          <span key={`e-${i}`} className="px-2 text-netflix-muted">
            …
          </span>
        ) : (
          <Button
            key={it}
            variant="ghost"
            size="sm"
            onClick={() => onChange(it)}
            className={cn(
              "h-9 min-w-9 px-3 text-sm",
              it === page
                ? "bg-netflix-red text-white hover:bg-netflix-red-hover"
                : "text-white hover:bg-white/10",
            )}
            aria-current={it === page ? "page" : undefined}
          >
            {it}
          </Button>
        ),
      )}

      {canGoNext ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-white hover:bg-white/10"
          onClick={() => onChange(page + 1)}
          aria-label={t("filters.nextPage")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      ) : null}
    </nav>
  );
}
