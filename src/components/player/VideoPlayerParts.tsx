import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  PictureInPicture2,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { PLAYBACK_SPEEDS } from "@/utils/player";
import { formatTime } from "@/utils/formatTime";

interface VideoPlayerControlsProps {
  playing: boolean;
  muted: boolean;
  volume: number;
  progress: number;
  buffered: number;
  duration: number;
  speed: number;
  showSpeed: boolean;
  skipAds: boolean;
  hasNextEpisode: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (val: number) => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSpeedMenu: () => void;
  onSetSpeed: (s: number) => void;
  onToggleSkipAds: () => void;
  onTogglePiP: () => void;
  onToggleFullscreen: () => void;
}

export function VideoPlayerControls({
  playing,
  muted,
  volume,
  progress,
  buffered,
  duration,
  speed,
  showSpeed,
  skipAds,
  hasNextEpisode,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onSeek,
  onToggleSpeedMenu,
  onSetSpeed,
  onToggleSkipAds,
  onTogglePiP,
  onToggleFullscreen,
}: VideoPlayerControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 opacity-0 transition-opacity group-hover/player:opacity-100 group-hover/player:[&>*]:pointer-events-auto">
      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-white/20">
          <div
            className="absolute left-0 top-0 h-full rounded bg-white/40"
            style={{ width: duration ? `${(buffered / duration) * 100}%` : 0 }}
          />
          <div
            className="absolute left-0 top-0 h-full rounded bg-netflix-red"
            style={{ width: duration ? `${(progress / duration) * 100}%` : 0 }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={progress}
          step={0.1}
          onChange={onSeek}
          className="relative h-1 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-netflix-red"
        />
      </div>
      <div className="flex items-center gap-3 text-white">
        <button
          onClick={onTogglePlay}
          className="rounded p-1 hover:bg-white/10"
          aria-label={t("player.playPauseAria")}
        >
          {playing ? (
            <Pause className="h-6 w-6 fill-current" />
          ) : (
            <Play className="h-6 w-6 fill-current" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onToggleMute} aria-label={muted ? t("player.unmute") : t("player.mute")}>
            {muted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="hidden h-1 w-20 cursor-pointer appearance-none rounded bg-white/30 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white sm:block"
          />
        </div>
        <span className="text-xs tabular-nums text-white/80">
          {formatTime(progress)} / {formatTime(duration)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <div className="relative">
            <button
              onClick={onToggleSpeedMenu}
              className="rounded px-2 py-1 text-xs font-medium hover:bg-white/10"
            >
              {speed}x
            </button>
            {showSpeed && (
              <div className="absolute bottom-full right-0 mb-2 flex flex-col rounded bg-black/95 ring-1 ring-white/10">
                {PLAYBACK_SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSetSpeed(s)}
                    className={cn(
                      "px-3 py-1 text-xs hover:bg-white/10",
                      s === speed && "text-netflix-red",
                    )}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onToggleSkipAds}
            className={cn(
              "rounded p-1 hover:bg-white/10",
              skipAds ? "text-netflix-red" : "text-white/70",
            )}
            aria-label={skipAds ? t("player.disableSkipAds") : t("player.enableSkipAds")}
            title={skipAds ? t("player.skippingAds") : t("player.allowAds")}
          >
            <SkipForward className="h-5 w-5" />
          </button>
          <button
            onClick={onTogglePiP}
            className="rounded p-1 hover:bg-white/10"
            aria-label={t("player.pip")}
          >
            <PictureInPicture2 className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleFullscreen}
            className="rounded p-1 hover:bg-white/10"
            aria-label={t("player.fullscreen")}
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function VideoPlayerError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg bg-black text-center">
      <p className="text-lg font-semibold text-white">{t("player.loadErrorTryServer")}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded bg-netflix-red px-4 py-2 text-sm font-medium text-white hover:bg-netflix-red-hover"
      >
        <RotateCcw className="h-4 w-4" /> {t("common.retry")}
      </button>
    </div>
  );
}

export function VideoPlayerEmbed({ src }: { src: string }) {
  const { t } = useTranslation();

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={src}
        title={t("player.iframeTitle")}
        className="h-full w-full"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
