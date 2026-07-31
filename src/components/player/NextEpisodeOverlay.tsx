import { SkipForward, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  secondsLeft: number;
  nextEpisodeName?: string;
  onPlayNow: () => void;
  onCancel: () => void;
}

export function NextEpisodeOverlay({ secondsLeft, nextEpisodeName, onPlayNow, onCancel }: Props) {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-end bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 sm:p-6">
      <div className="w-full max-w-[280px] rounded-lg bg-netflix-dark/95 p-3.5 shadow-2xl ring-1 ring-white/10 sm:max-w-xs sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-netflix-muted">
            {t("player.nextEpisodeIn", { seconds: secondsLeft })}
          </p>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t("common.cancel")}
            className="shrink-0 text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {nextEpisodeName && (
          <p className="mt-1 truncate text-sm font-semibold text-white">{nextEpisodeName}</p>
        )}
        <button
          type="button"
          onClick={onPlayNow}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded bg-netflix-red px-3 py-2 text-sm font-semibold text-white transition hover:bg-netflix-red/90"
        >
          <SkipForward className="h-4 w-4" />
          {t("player.playNextNow")}
        </button>
      </div>
    </div>
  );
}
