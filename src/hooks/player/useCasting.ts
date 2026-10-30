import { useCallback, useEffect, useState } from "react";

/* Minimal typings for the Google Cast Web Sender SDK (loaded on demand). */
type CastContext = {
  setOptions: (o: Record<string, unknown>) => void;
  getCastState: () => string;
  addEventListener: (type: string, cb: (e: { castState?: string }) => void) => void;
  requestSession: () => Promise<unknown>;
  getCurrentSession: () => {
    loadMedia: (req: unknown) => Promise<unknown>;
  } | null;
};

type CastWindow = Window & {
  __onGCastApiAvailable?: (available: boolean) => void;
  cast?: {
    framework: {
      CastContext: { getInstance: () => CastContext };
      CastContextEventType: { CAST_STATE_CHANGED: string };
      CastState: { NO_DEVICES_AVAILABLE: string; CONNECTED: string };
    };
  };
  chrome?: {
    cast?: {
      AutoJoinPolicy: { ORIGIN_SCOPED: string };
      media: {
        DEFAULT_MEDIA_RECEIVER_APP_ID: string;
        MediaInfo: new (url: string, type: string) => Record<string, unknown>;
        GenericMediaMetadata: new () => Record<string, unknown>;
        LoadRequest: new (info: unknown) => Record<string, unknown>;
        HlsSegmentFormat: { TS: string };
      };
    };
  };
  WebKitPlaybackTargetAvailabilityEvent?: unknown;
};

const SDK_URL = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";

let sdkPromise: Promise<boolean> | null = null;

function loadCastSdk(): Promise<boolean> {
  const w = window as CastWindow;

  // The Cast sender only works in Chrome (desktop and Android).
  if (!w.chrome || /iphone|ipad|ipod/i.test(navigator.userAgent)) return Promise.resolve(false);

  sdkPromise ??= new Promise((resolve) => {
    w.__onGCastApiAvailable = (available) => resolve(available);

    const script = document.createElement("script");

    script.src = SDK_URL;

    script.async = true;

    script.onerror = () => resolve(false);

    document.head.appendChild(script);
  });

  return sdkPromise;
}

type WebkitVideo = HTMLVideoElement & { webkitShowPlaybackTargetPicker?: () => void };

/**
 * Chromecast (Chrome) and AirPlay (Safari) for the current stream. Cast plays the
 * original HLS URL on the TV, so the app's ad skipping doesn't apply there.
 */
export function useCasting(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string,
  title: string | undefined,
) {
  const [castAvailable, setCastAvailable] = useState(false);

  const [airplayAvailable, setAirplayAvailable] = useState(false);

  useEffect(() => {
    let alive = true;

    void loadCastSdk().then((ok) => {
      const w = window as CastWindow;

      if (!ok || !alive || !w.cast || !w.chrome?.cast) return;

      const context = w.cast.framework.CastContext.getInstance();

      context.setOptions({
        receiverApplicationId: w.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: w.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      const update = () =>
        alive &&
        setCastAvailable(
          context.getCastState() !== w.cast!.framework.CastState.NO_DEVICES_AVAILABLE,
        );

      update();

      context.addEventListener(w.cast.framework.CastContextEventType.CAST_STATE_CHANGED, update);
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !(window as CastWindow).WebKitPlaybackTargetAvailabilityEvent) return;

    const onAvailability = (e: Event) =>
      setAirplayAvailable((e as Event & { availability?: string }).availability === "available");

    video.addEventListener("webkitplaybacktargetavailabilitychanged", onAvailability);

    return () =>
      video.removeEventListener("webkitplaybacktargetavailabilitychanged", onAvailability);
  }, [videoRef]);

  const cast = useCallback(async () => {
    const w = window as CastWindow;

    const video = videoRef.current;

    if (!w.cast || !w.chrome?.cast || !src) return false;

    const context = w.cast.framework.CastContext.getInstance();

    if (!context.getCurrentSession()) await context.requestSession();

    const session = context.getCurrentSession();

    if (!session) return false;

    const media = new w.chrome.cast.media.MediaInfo(src, "application/x-mpegurl");

    media.hlsSegmentFormat = w.chrome.cast.media.HlsSegmentFormat.TS;

    const metadata = new w.chrome.cast.media.GenericMediaMetadata();

    metadata.title = title ?? document.title;

    media.metadata = metadata;

    const request = new w.chrome.cast.media.LoadRequest(media);

    request.currentTime = video?.currentTime ?? 0;

    request.autoplay = true;

    await session.loadMedia(request);

    video?.pause();

    return true;
  }, [videoRef, src, title]);

  const airplay = useCallback(() => {
    (videoRef.current as WebkitVideo | null)?.webkitShowPlaybackTargetPicker?.();
  }, [videoRef]);

  return { castAvailable, airplayAvailable, cast, airplay };
}
