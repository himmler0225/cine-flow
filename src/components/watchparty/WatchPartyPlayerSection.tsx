import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SyncedPlayer } from "@/components/watchparty/SyncedPlayer";
import { ReactionOverlay } from "@/components/watchparty/ReactionOverlay";
import { ManualSyncBar } from "@/components/watchparty/ManualSyncBar";
import { Button } from "@/components/ui/button";
import type { SyncedPlayerHandle } from "@/components/watchparty/SyncedPlayer";
import type { FloatingReaction } from "@/components/watchparty/ReactionOverlay";
import type { IframeProvider } from "@/lib/iframeSync";
import type { WatchRoom } from "@/types/watchParty";

type Playable = {
  src: string;
  embed?: string;
  usesHls: boolean;
};

type Props = {
  room: WatchRoom;
  playable: Playable;
  isHost: boolean;
  playerRef: React.RefObject<SyncedPlayerHandle | null>;
  countdown: number | null;
  reactions: FloatingReaction[];
  waitingForHost: boolean;
  hostAwayOverlay: boolean;
  iframeInfo: { provider: IframeProvider; supportsAuto: boolean } | null;
  autoSyncActive: boolean;
  manualSync: boolean;
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onProviderReady: (info: { provider: IframeProvider; supportsAuto: boolean } | null) => void;
  onLeave: () => void;
  onStartCountdown: () => void;
  onAdjustTime: (delta: number) => void;
  onBroadcastPlay: () => void;
  onBroadcastPause: () => void;
};

export function WatchPartyPlayerSection({
  room,
  playable,
  isHost,
  playerRef,
  countdown,
  reactions,
  waitingForHost,
  hostAwayOverlay,
  iframeInfo,
  autoSyncActive,
  manualSync,
  onPlay,
  onPause,
  onSeek,
  onProviderReady,
  onLeave,
  onStartCountdown,
  onAdjustTime,
  onBroadcastPlay,
  onBroadcastPause,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="relative">
        <SyncedPlayer
          ref={playerRef}
          src={playable.src}
          embed={playable.embed}
          poster={room.thumb_url ?? undefined}
          disabled={!isHost}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onProviderReady={onProviderReady}
        />

        {countdown !== null && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
            <div className="text-center">
              <div className="animate-pulse text-7xl font-bold text-white">
                {countdown === 0 ? t("watchparty.countdownStart") : countdown}
              </div>
              <p className="mt-2 text-sm text-white/80">
                {countdown === 0 ? t("watchparty.countdownStart") : t("watchparty.countdownHint")}
              </p>
            </div>
          </div>
        )}

        <ReactionOverlay reactions={reactions} />

        {!waitingForHost && hostAwayOverlay && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 rounded-t-lg bg-black/60 px-3 py-2 text-center text-xs text-amber-200">
            {t("watchparty.hostLeftWaiting")}
          </div>
        )}

        {waitingForHost && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/85 backdrop-blur-sm">
            <div className="animate-pulse text-5xl">⏳</div>
            <div className="text-center">
              <p className="text-base font-semibold text-white">
                {t("watchparty.waitingHostJoin")}
              </p>
              <p className="mt-1 text-xs text-netflix-muted">
                {t("watchparty.startsWhenHostJoins")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLeave}
              className="mt-1 border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <LogOut className="h-3.5 w-3.5" /> {t("watchparty.leaveRoom")}
            </Button>
          </div>
        )}
      </div>

      <div>
        <h1 className="text-xl font-bold text-white md:text-2xl">{room.movie_name}</h1>
        {room.episode_name && (
          <p className="mt-0.5 text-sm text-netflix-muted">{room.episode_name}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {isHost ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-200">
              {t("watchparty.youAreHost")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-netflix-muted">
              {t("watchparty.hostOnlyControls")}
            </span>
          )}
          {autoSyncActive && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
              {t("watchparty.hlsSyncActive")}
            </span>
          )}
          {iframeInfo && !playable.usesHls && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${
                iframeInfo.supportsAuto
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                  : "border-amber-400/40 bg-amber-400/10 text-amber-200"
              }`}
            >
              {iframeInfo.supportsAuto
                ? t("watchparty.iframeSync", { provider: iframeInfo.provider })
                : t("watchparty.iframeNoSync")}
            </span>
          )}
          {isHost &&
            iframeInfo &&
            !iframeInfo.supportsAuto &&
            !playable.usesHls &&
            countdown === null && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-amber-400/40 bg-amber-400/10 text-xs text-amber-200 hover:bg-amber-400/20"
                onClick={onStartCountdown}
              >
                {t("watchparty.countdown321")}
              </Button>
            )}
        </div>
        {manualSync && (
          <div className="mt-3">
            <ManualSyncBar
              playbackTime={room.playback_time}
              isPlaying={room.is_playing}
              isHost={isHost}
              onAdjustTime={onAdjustTime}
              onBroadcastPlay={onBroadcastPlay}
              onBroadcastPause={onBroadcastPause}
              onStartCountdown={onStartCountdown}
            />
          </div>
        )}
      </div>
    </div>
  );
}
