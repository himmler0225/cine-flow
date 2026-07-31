import { useTranslation } from "react-i18next";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { VideoPlayerControls, VideoPlayerError } from "@/components/player/VideoPlayerParts";
import { VideoPlayerEmbed } from "@/components/player/VideoPlayerEmbed";
import { NextEpisodeOverlay } from "@/components/player/NextEpisodeOverlay";

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
        className="group/player relative aspect-video w-full overflow-hidden bg-black"
      >
        <video
          ref={player.videoRef}
          poster={props.poster}
          playsInline
          controls={false}
          className="h-full w-full"
          onClick={player.togglePlay}
        />
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
          onTogglePlay={player.togglePlay}
          onToggleMute={player.toggleMute}
          onVolumeChange={player.setVolumeVal}
          onSeek={player.seek}
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
