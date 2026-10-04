import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pause, Play } from "lucide-react";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { usePlayerChrome } from "@/hooks/player/usePlayerChrome";
import { canUsePictureInPicture } from "@/hooks/player/usePlayerControls";
import { VideoPlayerControls, VideoPlayerError } from "@/components/player/VideoPlayerParts";
import { VideoPlayerEmbed } from "@/components/player/VideoPlayerEmbed";
import { NextEpisodeOverlay } from "@/components/player/NextEpisodeOverlay";
import { PLAYER_SEEK_STEP_SEC } from "@/constants/timing";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  embed?: string;
  poster?: string;
  initialTime?: number;
  onEnded?: () => void;
  onError?: () => void;
  onProgress?: (currentSec: number, durationSec: number) => void;
  onLiveTime?: (currentSec: number, durationSec: number) => void;
  onResumeApplied?: (sec: number) => void;
  onNextEpisode?: () => void;
  autoAdvanceSecondsLeft?: number | null;
  nextEpisodeName?: string;
  onPlayNextNow?: () => void;
  onCancelAutoAdvance?: () => void;
}

export function VideoPlayer(props: Props) {
  const { t } = useTranslation();

  const player = useVideoPlayer(props);

  const chrome = usePlayerChrome({
    playing: player.playing,
    keepVisible: player.showSpeed || !!player.activeAd,
    togglePlay: player.togglePlay,
    seekBy: player.seekBy,
    toggleFullscreen: player.toggleFullscreen,
  });

  const [canPiP, setCanPiP] = useState(false);

  const videoRef = player.videoRef;

  useEffect(() => {
    setCanPiP(canUsePictureInPicture(videoRef.current));
  }, [videoRef]);

  const autoAdvance =
    props.autoAdvanceSecondsLeft != null && props.onPlayNextNow && props.onCancelAutoAdvance ? (
      <NextEpisodeOverlay
        secondsLeft={props.autoAdvanceSecondsLeft}
        nextEpisodeName={props.nextEpisodeName}
        onPlayNow={props.onPlayNextNow}
        onCancel={props.onCancelAutoAdvance}
      />
    ) : null;

  if (player.hasError) {
    return (
      <VideoPlayerError
        onRetry={player.retry}
        onUseBackup={player.embedSrc ? player.useBackupPlayer : undefined}
      />
    );
  }

  if (player.useEmbed && player.embedSrc) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg bg-black">
        <VideoPlayerEmbed
          src={player.embedSrc}
          m3u8={player.playableSrc || undefined}
          initialTime={props.initialTime}
          onProgress={props.onProgress}
          onLiveTime={props.onLiveTime}
          onEnded={props.onEnded}
        />
        {autoAdvance}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg bg-black">
      <div
        ref={player.containerRef}
        className={cn(
          "group/player relative aspect-video w-full overflow-hidden bg-black",
          !chrome.visible && "cursor-none",
        )}
        {...chrome.containerProps}
      >
        <video
          ref={player.videoRef}
          poster={props.poster}
          playsInline
          controls={false}
          className="h-full w-full"
        />
        {/* Gesture surface over the video: tap / double-tap / click (see usePlayerChrome). */}
        <div
          aria-hidden
          className="absolute inset-0 z-10 touch-manipulation"
          {...chrome.surfaceProps}
        />
        {chrome.seekFlash && (
          <div
            key={chrome.seekFlash.id}
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 z-10 flex w-2/5 items-center justify-center bg-white/10 text-sm font-semibold text-white animate-in fade-in",
              chrome.seekFlash.direction < 0 ? "left-0 rounded-r-full" : "right-0 rounded-l-full",
            )}
          >
            {chrome.seekFlash.direction < 0
              ? t("player.seekFlashBack", { seconds: PLAYER_SEEK_STEP_SEC })
              : t("player.seekFlashForward", { seconds: PLAYER_SEEK_STEP_SEC })}
          </div>
        )}
        {chrome.touchUi && chrome.visible && (
          <button
            type="button"
            onClick={() => {
              player.togglePlay();

              chrome.reveal();
            }}
            className="absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/20 backdrop-blur-sm active:scale-95"
            aria-label={t("player.playPauseAria")}
          >
            {player.playing ? (
              <Pause className="h-7 w-7 fill-current" />
            ) : (
              <Play className="ml-0.5 h-7 w-7 fill-current" />
            )}
          </button>
        )}
        {player.isPremium && player.skipAds && player.adsSkipped > 0 && (
          <div className="absolute right-3 top-3 z-30 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white ring-1 ring-white/10">
            {t("player.adsSkipped", { count: player.adsSkipped })}
          </div>
        )}
        {player.dataSaver && !player.useEmbed && (
          <div className="absolute left-3 top-3 rounded bg-emerald-600/90 px-2 py-1 text-[10px] font-medium text-white">
            {t("auth.dataSaver")}
          </div>
        )}
        {autoAdvance}
        <div className="pointer-events-none absolute left-3 top-12 hidden rounded bg-black/60 px-2 py-1 text-[10px] text-white/80 opacity-0 transition-opacity group-hover/player:opacity-100 md:block">
          {t("player.keyboardHints", {
            next: props.onNextEpisode ? " · N" : "",
          })}
        </div>
        <VideoPlayerControls
          visible={chrome.visible}
          canPiP={canPiP}
          playing={player.playing}
          muted={player.muted}
          volume={player.volume}
          progress={player.progress}
          buffered={player.buffered}
          duration={player.duration}
          speed={player.speed}
          showSpeed={player.showSpeed}
          skipAds={player.skipAds}
          isPremium={player.isPremium}
          activeAd={!!player.activeAd}
          hasNextEpisode={!!props.onNextEpisode}
          levels={player.levels}
          subtitleTracks={player.subtitleTracks}
          currentLevel={player.currentLevel}
          subtitleId={player.subtitleId}
          onInteract={chrome.reveal}
          onTogglePlay={player.togglePlay}
          onToggleMute={player.toggleMute}
          onVolumeChange={player.setVolumeVal}
          onSeek={player.seekTo}
          onSeekBy={player.seekBy}
          onScrubChange={chrome.onScrubChange}
          onToggleSpeedMenu={() => player.setShowSpeed((s) => !s)}
          onSetSpeed={player.setSpeedVal}
          onToggleSkipAds={() => player.setSkipAds((v) => !v)}
          onSkipCurrentAd={player.skipCurrentAd}
          onTogglePiP={player.togglePiP}
          onToggleFullscreen={player.toggleFullscreen}
          onSelectQuality={player.selectQuality}
          onSelectSubtitle={player.selectSubtitle}
        />
      </div>
    </div>
  );
}
