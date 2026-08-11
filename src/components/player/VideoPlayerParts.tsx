import { useEffect, useRef } from "react";
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
import type { HlsQualityLevel, HlsSubtitleTrack } from "@/hooks/player/usePlayerHlsSource";

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
  isPremium: boolean;
  activeAd?: boolean;
  hasNextEpisode: boolean;
  levels: HlsQualityLevel[];
  subtitleTracks: HlsSubtitleTrack[];
  currentLevel: number;
  subtitleId: number;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (val: number) => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSpeedMenu: () => void;
  onSetSpeed: (s: number) => void;
  onToggleSkipAds: () => void;
  onSkipCurrentAd?: () => void;
  onTogglePiP: () => void;
  onToggleFullscreen: () => void;
  onSelectQuality: (level: number) => void;
  onSelectSubtitle: (id: number) => void;
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
  isPremium,
  activeAd = false,
  levels,
  subtitleTracks,
  currentLevel,
  subtitleId,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onSeek,
  onToggleSpeedMenu,
  onSetSpeed,
  onToggleSkipAds,
  onSkipCurrentAd,
  onTogglePiP,
  onToggleFullscreen,
  onSelectQuality,
  onSelectSubtitle,
}: VideoPlayerControlsProps) {
  const { t } = useTranslation();

  const speedButtonRef = useRef<HTMLButtonElement>(null);

  const speedMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSpeed) return;

    const menu = speedMenuRef.current;

    if (!menu) return;

    const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));

    const selectedIdx = Math.max(
      0,
      PLAYBACK_SPEEDS.findIndex((s) => s === speed),
    );

    items[selectedIdx]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      const idx = items.indexOf(document.activeElement as HTMLButtonElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();

        items[(idx + 1 + items.length) % items.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();

        items[(idx - 1 + items.length) % items.length]?.focus();
      } else if (e.key === "Escape") {
        e.preventDefault();

        onToggleSpeedMenu();

        speedButtonRef.current?.focus();
      } else if (e.key === "Tab") {
        e.preventDefault();
      }
    };

    menu.addEventListener("keydown", onKeyDown);

    return () => menu.removeEventListener("keydown", onKeyDown);
  }, [showSpeed, speed, onToggleSpeedMenu]);

  useEffect(() => {
    if (!showSpeed) return;

    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (speedMenuRef.current?.contains(target) || speedButtonRef.current?.contains(target)) {
        return;
      }

      onToggleSpeedMenu();
    };

    document.addEventListener("mousedown", onClickOutside);

    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showSpeed, onToggleSpeedMenu]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 transition-opacity focus-within:opacity-100 group-hover/player:opacity-100 group-focus-within/player:opacity-100 group-hover/player:[&>*]:pointer-events-auto group-focus-within/player:[&>*]:pointer-events-auto",
        activeAd ? "opacity-100 [&>*]:pointer-events-auto" : "opacity-100 md:opacity-0",
      )}
    >
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
          aria-label={t("player.seekAria")}
          aria-valuetext={formatTime(progress)}
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
            aria-label={t("player.volumeAria")}
            className="hidden h-1 w-20 cursor-pointer appearance-none rounded bg-white/30 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white sm:block"
          />
        </div>
        <span className="text-xs tabular-nums text-white/80">
          {formatTime(progress)} / {formatTime(duration)}
        </span>
        {activeAd && onSkipCurrentAd && (
          <button
            type="button"
            onClick={onSkipCurrentAd}
            className="inline-flex items-center gap-1.5 rounded bg-netflix-red px-2.5 py-1 text-xs font-semibold text-white hover:bg-netflix-red/90"
          >
            <SkipForward className="h-3.5 w-3.5" />
            {t("player.skipAdNow")}
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          {levels.length > 1 && (
            <label className="sr-only" htmlFor="player-quality">
              {t("player.quality")}
            </label>
          )}
          {levels.length > 1 && (
            <select
              id="player-quality"
              value={currentLevel}
              onChange={(e) => onSelectQuality(Number(e.target.value))}
              className="max-w-[5.5rem] rounded bg-black/60 px-1.5 py-1 text-xs text-white ring-1 ring-white/10"
              aria-label={t("player.quality")}
            >
              <option value={-1}>{t("player.qualityAuto")}</option>
              {levels.map((level) => (
                <option key={level.index} value={level.index}>
                  {level.label}
                </option>
              ))}
            </select>
          )}
          {subtitleTracks.length > 0 && (
            <select
              id="player-subtitles"
              value={subtitleId}
              onChange={(e) => onSelectSubtitle(Number(e.target.value))}
              className="max-w-[5.5rem] rounded bg-black/60 px-1.5 py-1 text-xs text-white ring-1 ring-white/10"
              aria-label={t("player.subtitles")}
            >
              <option value={-1}>{t("player.subtitlesOff")}</option>
              {subtitleTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          )}
          <div className="relative">
            <button
              ref={speedButtonRef}
              onClick={onToggleSpeedMenu}
              className="rounded px-2 py-1 text-xs font-medium hover:bg-white/10"
              aria-label={t("player.speed")}
              aria-expanded={showSpeed}
              aria-haspopup="menu"
            >
              {speed}x
            </button>
            {showSpeed && (
              <div
                ref={speedMenuRef}
                role="menu"
                aria-label={t("player.speed")}
                className="absolute bottom-full right-0 mb-2 flex flex-col rounded bg-black/95 ring-1 ring-white/10"
              >
                {PLAYBACK_SPEEDS.map((s) => (
                  <button
                    key={s}
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => {
                      onSetSpeed(s);

                      speedButtonRef.current?.focus();
                    }}
                    className={cn(
                      "px-3 py-1 text-xs hover:bg-white/10 focus-visible:bg-white/15 focus-visible:outline-none",
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
              !isPremium && "opacity-60",
            )}
            aria-label={
              isPremium
                ? skipAds
                  ? t("player.disableSkipAds")
                  : t("player.enableSkipAds")
                : t("player.skipAdsPremiumOnly")
            }
            title={
              isPremium
                ? skipAds
                  ? t("player.skippingAds")
                  : t("player.allowAds")
                : t("player.skipAdsPremiumOnly")
            }
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

export function VideoPlayerError({
  onRetry,
  onUseBackup,
}: {
  onRetry: () => void;
  onUseBackup?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg bg-black text-center">
      <p className="text-lg font-semibold text-white">{t("player.loadErrorTryServer")}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded bg-netflix-red px-4 py-2 text-sm font-medium text-white hover:bg-netflix-red-hover"
        >
          <RotateCcw className="h-4 w-4" /> {t("common.retry")}
        </button>
        {onUseBackup && (
          <button
            type="button"
            onClick={onUseBackup}
            className="inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/15"
          >
            {t("player.useBackupPlayer")}
          </button>
        )}
      </div>
    </div>
  );
}
