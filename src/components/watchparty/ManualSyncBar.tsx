import { Minus, Pause, Play, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/utils/formatTime";

interface ManualSyncBarProps {
  playbackTime: number;
  isPlaying: boolean;
  isHost: boolean;
  onAdjustTime: (delta: number) => void;
  onBroadcastPlay: () => void;
  onBroadcastPause: () => void;
  onStartCountdown: () => void;
}

export function ManualSyncBar({
  playbackTime,
  isPlaying,
  isHost,
  onAdjustTime,
  onBroadcastPlay,
  onBroadcastPause,
  onStartCountdown,
}: ManualSyncBarProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3">
      <p className="text-xs text-amber-200/90">{t("watchparty.manualSyncHint")}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-black/40 px-2.5 py-1 font-mono text-sm text-white">
          {formatTime(playbackTime)}
          {isPlaying ? " ▶" : " ⏸"}
        </span>

        {isHost ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-white/15 bg-transparent text-white"
              onClick={() => onAdjustTime(-10)}
              aria-label={t("watchparty.seekBack10")}
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" /> 10s
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-white/15 bg-transparent text-white"
              onClick={() => onAdjustTime(10)}
              aria-label={t("watchparty.seekForward10")}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> 10s
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={onBroadcastPlay}
            >
              <Play className="h-3.5 w-3.5" /> {t("watchparty.broadcastPlay")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-white/15 text-white"
              onClick={onBroadcastPause}
            >
              <Pause className="h-3.5 w-3.5" /> {t("watchparty.broadcastPause")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-amber-400/40 text-amber-200"
              onClick={onStartCountdown}
            >
              {t("watchparty.countdown321")}
            </Button>
          </>
        ) : (
          <p className="text-xs text-netflix-muted">{t("watchparty.manualSyncJoiner")}</p>
        )}
      </div>
    </div>
  );
}
