import { RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  title: string;
  message?: string;
  onRetry?: () => void;
}

export function MovieRowError({ title, message, onRetry }: Props) {
  const { t } = useTranslation();
  return (
    <section className="py-4">
      <div className="mb-3 flex items-center justify-between px-4 md:px-12">
        <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">{title}</h2>
      </div>
      <div className="px-4 md:px-12">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-netflix-surface/60 px-4 py-5 text-sm text-netflix-muted">
          <span>{message ?? t("movie.loadErrorDefault")}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
            >
              <RotateCw className="h-3.5 w-3.5" /> {t("common.retry")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
