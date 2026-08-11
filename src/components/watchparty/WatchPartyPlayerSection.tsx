import { LogOut, Loader2, Pause, Settings2 } from "lucide-react";
import { useState } from "react";
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
  iframeInfo: {
    provider: IframeProvider;
    supportsAuto: boolean;
  } | null;
  manualSync: boolean;
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onProviderReady: (
    info: {
      provider: IframeProvider;
      supportsAuto: boolean;
    } | null,
  ) => void;
  onLeave: () => void;
  onStartCountdown: () => void;
  onAdjustTime: (delta: number) => void;
  onBroadcastPlay: () => void;
  onBroadcastPause: () => void;
  onReady?: () => void;
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
  onReady,
}: Props) {
  const { t } = useTranslation();

  const [showSync, setShowSync] = useState(false);

  const needsManualSync = manualSync && iframeInfo && !iframeInfo.supportsAuto && !playable.usesHls;

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg bg-black">
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
          onReady={onReady}
        />

        {countdown !== null && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-7xl font-bold text-white">
                {countdown === 0 ? t("watchparty.countdownStart") : countdown}
              </div>

              {countdown > 0 && (
                <p className="mt-2 text-sm text-white/70">{t("watchparty.countdownHint")}</p>
              )}
            </div>
          </div>
        )}

        <ReactionOverlay reactions={reactions} />

        {!waitingForHost && hostAwayOverlay && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-black/60 px-3 py-2 text-center text-xs text-amber-200">
            {t("watchparty.hostLeftWaiting")}
          </div>
        )}

        {waitingForHost && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/85 backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
              <Loader2 className="h-6 w-6 animate-spin text-netflix-red" />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-white">{t("watchparty.waitingHostJoin")}</p>

              <p className="mt-1 text-xs text-netflix-muted">
                {t("watchparty.startsWhenHostJoins")}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onLeave}
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              {t("watchparty.leaveRoom")}
            </Button>
          </div>
        )}

        {!isHost &&
          !room.is_playing &&
          !waitingForHost &&
          !hostAwayOverlay &&
          countdown === null && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/85 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                <Pause className="h-6 w-6 text-netflix-red" />
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-white">
                  {t("watchparty.hostPausedTitle")}
                </p>

                <p className="mt-1 text-xs text-netflix-muted">{t("watchparty.hostPausedHint")}</p>
              </div>
            </div>
          )}
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-white md:text-2xl">{room.movie_name}</h1>

            {room.episode_name && (
              <p className="mt-0.5 text-sm text-netflix-muted">{room.episode_name}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isHost && (
              <span className="rounded-md bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-200 ring-1 ring-amber-400/20">
                👑 Host
              </span>
            )}
          </div>
        </div>

        {needsManualSync && !isHost && (
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

        {needsManualSync && isHost && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowSync((value) => !value)}
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-md
                px-2.5
                py-1.5
                text-xs
                text-netflix-muted
                transition-colors
                hover:bg-white/5
                hover:text-white
              "
            >
              <Settings2 className="h-3.5 w-3.5" />

              {showSync ? "Ẩn đồng bộ" : "Đồng bộ thủ công"}
            </button>

            {showSync && (
              <div className="mt-2">
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
        )}
      </div>
    </div>
  );
}
