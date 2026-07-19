import { useEffect, useRef } from "react";
import { sendCommand, subscribeEvents, type IframeProvider } from "@/lib/iframeSync";
import type { SyncedPlayerProps } from "@/components/watchparty/synced-player/types";

export type SyncRefs = {
  lastSyncRef: React.MutableRefObject<number>;
  seekingFromSyncRef: React.MutableRefObject<boolean>;
  lastIframeTimeRef: React.MutableRefObject<number>;
  iframePausedRef: React.MutableRefObject<boolean>;
};

export function useSyncedVideoEvents(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  useIframe: boolean,
  refs: SyncRefs,
  handlers: {
    onPlay?: (t: number) => void;
    onPause?: (t: number) => void;
    onSeek?: (t: number) => void;
  },
) {
  const { lastSyncRef, seekingFromSyncRef } = refs;
  const { onPlay, onPause, onSeek } = handlers;

  useEffect(() => {
    if (useIframe) return;
    const v = videoRef.current;
    if (!v) return;

    const handlePlay = () => {
      if (seekingFromSyncRef.current) return;
      onPlay?.(v.currentTime);
    };
    const handlePause = () => {
      if (seekingFromSyncRef.current) return;
      onPause?.(v.currentTime);
    };
    const handleSeeked = () => {
      if (seekingFromSyncRef.current) return;
      const now = Date.now();
      if (now - lastSyncRef.current < 400) return;
      lastSyncRef.current = now;
      onSeek?.(v.currentTime);
    };

    v.addEventListener("play", handlePlay);
    v.addEventListener("pause", handlePause);
    v.addEventListener("seeked", handleSeeked);
    return () => {
      v.removeEventListener("play", handlePlay);
      v.removeEventListener("pause", handlePause);
      v.removeEventListener("seeked", handleSeeked);
    };
  }, [onPlay, onPause, onSeek, useIframe, videoRef, lastSyncRef, seekingFromSyncRef]);
}

export function useSyncedIframeEvents(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  useIframe: boolean,
  iframeInfo: { provider: IframeProvider; supportsAuto: boolean } | null,
  refs: SyncRefs,
  handlers: {
    onPlay?: (t: number) => void;
    onPause?: (t: number) => void;
    onSeek?: (t: number) => void;
  },
) {
  const { lastSyncRef, lastIframeTimeRef, iframePausedRef } = refs;
  const { onPlay, onPause, onSeek } = handlers;

  useEffect(() => {
    if (!useIframe || !iframeInfo || !iframeInfo.supportsAuto) return;
    const unsub = subscribeEvents(iframeRef.current, iframeInfo.provider, {
      onTime: (t) => {
        lastIframeTimeRef.current = t;
      },
      onPlay: (t) => {
        iframePausedRef.current = false;
        const now = Date.now();
        if (now - lastSyncRef.current < 400) return;
        lastSyncRef.current = now;
        onPlay?.(t);
      },
      onPause: (t) => {
        iframePausedRef.current = true;
        const now = Date.now();
        if (now - lastSyncRef.current < 400) return;
        lastSyncRef.current = now;
        onPause?.(t);
      },
      onSeek: (t) => {
        const now = Date.now();
        if (now - lastSyncRef.current < 400) return;
        lastSyncRef.current = now;
        onSeek?.(t);
      },
    });
    return unsub;
  }, [
    useIframe,
    iframeInfo,
    iframeRef,
    lastSyncRef,
    lastIframeTimeRef,
    iframePausedRef,
    onPlay,
    onPause,
    onSeek,
  ]);
}

export function useSyncedProviderReady(
  iframeInfo: { provider: IframeProvider; supportsAuto: boolean } | null,
  onProviderReady?: SyncedPlayerProps["onProviderReady"],
) {
  useEffect(() => {
    if (!onProviderReady) return;
    if (iframeInfo) {
      onProviderReady({ provider: iframeInfo.provider, supportsAuto: iframeInfo.supportsAuto });
      return;
    }
    onProviderReady(null);
  }, [iframeInfo, onProviderReady]);
}

export function playVideoElement(video: HTMLVideoElement | null) {
  void video?.play().catch(() => {
    if (!video) return;
    video.muted = true;
    void video.play().catch(() => {});
  });
}

export function createSyncedPlayerHandle(opts: {
  useIframe: boolean;
  iframeInfo: { provider: IframeProvider; supportsAuto: boolean } | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  refs: SyncRefs;
}) {
  const { useIframe, iframeInfo, videoRef, iframeRef, refs } = opts;
  const { seekingFromSyncRef, lastIframeTimeRef, iframePausedRef } = refs;
  const provider = iframeInfo?.provider ?? "generic";

  return {
    play: () => {
      if (useIframe) {
        iframePausedRef.current = false;
        sendCommand(iframeRef.current, provider, "play", { time: lastIframeTimeRef.current });
        return;
      }
      playVideoElement(videoRef.current);
    },
    pause: () => {
      if (useIframe) {
        iframePausedRef.current = true;
        sendCommand(iframeRef.current, provider, "pause", { time: lastIframeTimeRef.current });
        return;
      }
      videoRef.current?.pause();
    },
    seek: (t: number) => {
      if (useIframe) {
        lastIframeTimeRef.current = t;
        sendCommand(iframeRef.current, provider, "seek", { time: t });
        return;
      }
      if (!videoRef.current) return;
      seekingFromSyncRef.current = true;
      videoRef.current.currentTime = t;
      window.setTimeout(() => {
        seekingFromSyncRef.current = false;
      }, 250);
    },
    paused: () => (useIframe ? iframePausedRef.current : (videoRef.current?.paused ?? true)),
    currentTime: () =>
      useIframe ? lastIframeTimeRef.current : (videoRef.current?.currentTime ?? 0),
    duration: () => (useIframe ? 0 : (videoRef.current?.duration ?? 0)),
  };
}
