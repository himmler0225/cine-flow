import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { attachHlsAdSkip } from "@/lib/hlsAdSkip";
import type { PlayerUiAction } from "@/hooks/player/playerReducer";

export type HlsQualityLevel = {
  index: number;
  height: number;
  bitrate: number;
  label: string;
};

export type HlsSubtitleTrack = {
  id: number;
  name: string;
};

export function usePlayerHlsSource(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string,
  embedSrc: string,
  useEmbed: boolean,
  skipAds: boolean,
  dispatch: React.Dispatch<PlayerUiAction>,
  onError?: () => void,
  pendingSeekRef?: React.MutableRefObject<number | null>,
  onFallbackEmbed?: () => void,
) {
  const adRangesRef = useRef<{ start: number; end: number }[]>([]);
  const skipAdsRef = useRef(skipAds);
  const hlsRef = useRef<Hls | null>(null);
  const [levels, setLevels] = useState<HlsQualityLevel[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<HlsSubtitleTrack[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [subtitleId, setSubtitleId] = useState(-1);

  useEffect(() => {
    skipAdsRef.current = skipAds;
    if (!skipAds) adRangesRef.current = [];
  }, [skipAds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || useEmbed) return;

    dispatch({ type: "setHasError", hasError: false });
    adRangesRef.current = [];
    setLevels([]);
    setSubtitleTracks([]);
    setCurrentLevel(-1);
    setSubtitleId(-1);

    const startPosition =
      pendingSeekRef?.current != null && pendingSeekRef.current >= 0 ? pendingSeekRef.current : -1;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      const onMeta = () => {
        if (startPosition >= 0) {
          video.currentTime = startPosition;
          if (pendingSeekRef) pendingSeekRef.current = null;
        }
      };
      video.addEventListener("loadedmetadata", onMeta);
      return () => {
        video.removeEventListener("loadedmetadata", onMeta);
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      video.src = src;
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    const hls = new Hls({
      enableWorker: true,
      capLevelToPlayerSize: true,
      startLevel: -1,
      ...(startPosition >= 0 ? { startPosition } : {}),
    });
    hlsRef.current = hls;
    hls.loadSource(src);
    hls.attachMedia(video);

    attachHlsAdSkip(
      hls,
      adRangesRef,
      (count) =>
        dispatch({
          type: "incrementAdsSkipped",
          count: typeof count === "number" ? count : 0,
        }),
      skipAdsRef,
    );

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setLevels(
        hls.levels.map((level, index) => ({
          index,
          height: level.height || 0,
          bitrate: level.bitrate || 0,
          label: level.height
            ? `${level.height}p`
            : `${Math.round((level.bitrate || 0) / 1000)}kbps`,
        })),
      );
      setCurrentLevel(hls.currentLevel);
      setSubtitleTracks(
        (hls.subtitleTracks ?? []).map((track, id) => ({
          id,
          name: track.name || track.lang || `CC ${id + 1}`,
        })),
      );
      setSubtitleId(hls.subtitleTrack);

      const pending = pendingSeekRef?.current;
      if (pending != null && pending >= 0) {
        try {
          video.currentTime = pending;
          dispatch({ type: "setProgress", progress: pending });
          if (pendingSeekRef) pendingSeekRef.current = null;
          void video.play().catch(() => {});
        } catch {
          /* best-effort seek clamp — setting currentTime can throw on some browsers/readyStates */
        }
      }
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
      setCurrentLevel(data.level);
    });

    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (!data.fatal) {
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        return;
      }
      console.error("[HLS fatal]", data.type, data.details);
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        try {
          hls.recoverMediaError();
          return;
        } catch {
          // recovery attempt itself threw — fall through to embed fallback / setHasError below
          console.warn("[HLS] recoverMediaError threw, falling back");
        }
      }
      if (embedSrc) {
        if (pendingSeekRef) pendingSeekRef.current = null;
        onFallbackEmbed?.();
        dispatch({ type: "setHasError", hasError: false });
        dispatch({ type: "setUseEmbed", useEmbed: true });
        return;
      }
      dispatch({ type: "setHasError", hasError: true });
      onError?.();
    });

    return () => {
      hlsRef.current = null;
      hls.destroy();
    };
  }, [src, embedSrc, useEmbed, onError, videoRef, dispatch, pendingSeekRef, onFallbackEmbed]);

  const selectQuality = (level: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = level;
    setCurrentLevel(level);
  };

  const selectSubtitle = (id: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.subtitleTrack = id;
    setSubtitleId(id);
  };

  return {
    adRangesRef,
    skipAdsRef,
    hlsRef,
    levels,
    subtitleTracks,
    currentLevel,
    subtitleId,
    selectQuality,
    selectSubtitle,
  };
}
