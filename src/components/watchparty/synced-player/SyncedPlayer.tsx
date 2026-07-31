import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { sendCommand } from "@/lib/iframeSync";
import type {
  SyncedPlayerHandle,
  SyncedPlayerProps,
} from "@/components/watchparty/synced-player/types";
import { useSyncedPlayerMode } from "@/components/watchparty/synced-player/useSyncedPlayerMode";
import { useSyncedHlsSource } from "@/components/watchparty/synced-player/useSyncedHlsSource";
import {
  createSyncedPlayerHandle,
  playVideoElement,
  useSyncedIframeEvents,
  useSyncedProviderReady,
  useSyncedVideoEvents,
} from "@/components/watchparty/synced-player/useSyncedPlayerEvents";
import { SyncedIframeView } from "@/components/watchparty/synced-player/SyncedIframeView";
import { SyncedVideoView } from "@/components/watchparty/synced-player/SyncedVideoView";

export const SyncedPlayer = forwardRef<SyncedPlayerHandle, SyncedPlayerProps>(function SyncedPlayer(
  { src, embed, poster, disabled, onPlay, onPause, onSeek, onProviderReady },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSyncRef = useRef(0);
  const seekingFromSyncRef = useRef(false);
  const lastIframeTimeRef = useRef(0);
  const iframePausedRef = useRef(true);
  const syncRefs = {
    lastSyncRef,
    seekingFromSyncRef,
    lastIframeTimeRef,
    iframePausedRef,
  };
  const { setHlsFailed, useIframe, iframeInfo } = useSyncedPlayerMode(src, embed);
  useSyncedProviderReady(iframeInfo, onProviderReady);
  useSyncedHlsSource(videoRef, src, useIframe, () => setHlsFailed(true));
  const eventHandlers = { onPlay, onPause, onSeek };
  useSyncedVideoEvents(videoRef, useIframe, syncRefs, eventHandlers);
  useSyncedIframeEvents(iframeRef, useIframe, iframeInfo, syncRefs, eventHandlers);
  useImperativeHandle(
    ref,
    () =>
      createSyncedPlayerHandle({
        useIframe,
        iframeInfo,
        videoRef,
        iframeRef,
        refs: syncRefs,
      }),
    [useIframe, iframeInfo],
  );
  const attemptJoinerPlay = useCallback(() => {
    if (!disabled) return;
    if (useIframe) {
      iframePausedRef.current = false;
      sendCommand(iframeRef.current, iframeInfo?.provider ?? "generic", "play", {
        time: lastIframeTimeRef.current,
      });
      return;
    }
    playVideoElement(videoRef.current);
  }, [disabled, useIframe, iframeInfo]);
  if (useIframe && iframeInfo) {
    return (
      <SyncedIframeView
        iframeRef={iframeRef}
        iframeInfo={iframeInfo}
        disabled={disabled}
        onGuestPlay={attemptJoinerPlay}
      />
    );
  }
  return (
    <SyncedVideoView
      videoRef={videoRef}
      poster={poster}
      disabled={disabled}
      onGuestPlay={attemptJoinerPlay}
    />
  );
});
