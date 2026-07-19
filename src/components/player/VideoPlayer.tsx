import { useTranslation } from "react-i18next";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import {
  VideoPlayerControls,
  VideoPlayerEmbed,
  VideoPlayerError,
} from "@/components/player/VideoPlayerParts";

interface Props {
  src: string;
  embed?: string;
  poster?: string;
  initialTime?: number;
  onEnded?: () => void;
  onError?: () => void;
  onProgress?: (currentSec: number, durationSec: number) => void;
  onResumeApplied?: (sec: number) => void;
  onNextEpisode?: () => void;
}

export function VideoPlayer(props: Props) {
  const { t } = useTranslation();
  const player = useVideoPlayer(props);

  if (player.hasError) {
    return <VideoPlayerError onRetry={player.retry} />;
  }

  if (player.useEmbed && player.embedSrc) {
    return <VideoPlayerEmbed src={player.embedSrc} />;
  }

  return (
    <div
      ref={player.containerRef}
      className="group/player relative aspect-video w-full overflow-hidden rounded-lg bg-black"
    >
      <video
        ref={player.videoRef}
        poster={props.poster}
        playsInline
        controls={false}
        className="h-full w-full"
        onClick={player.togglePlay}
      />
      {player.skipAds && player.adsSkipped > 0 && (
        <div className="absolute right-3 top-3 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white ring-1 ring-white/10">
          {t("player.adsSkipped", { count: player.adsSkipped })}
        </div>
      )}
      {player.dataSaver && !player.useEmbed && (
        <div className="absolute left-3 top-3 rounded bg-emerald-600/90 px-2 py-1 text-[10px] font-medium text-white">
          {t("auth.dataSaver")}
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-12 hidden rounded bg-black/60 px-2 py-1 text-[10px] text-white/80 opacity-0 transition-opacity group-hover/player:opacity-100 md:block">
        {t("player.keyboardHints", { next: props.onNextEpisode ? " · N" : "" })}
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
        hasNextEpisode={!!props.onNextEpisode}
        onTogglePlay={player.togglePlay}
        onToggleMute={player.toggleMute}
        onVolumeChange={player.setVolumeVal}
        onSeek={player.seek}
        onToggleSpeedMenu={() => player.setShowSpeed((s) => !s)}
        onSetSpeed={player.setSpeedVal}
        onToggleSkipAds={() => player.setSkipAds((v) => !v)}
        onTogglePiP={player.togglePiP}
        onToggleFullscreen={player.toggleFullscreen}
      />
    </div>
  );
}
