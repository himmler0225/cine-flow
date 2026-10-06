import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { attachHlsAdDetection, detectAdRangesFromUrl, type AdRange } from "@/lib/hlsAdSkip";
import { shouldUseNativeHls } from "@/lib/hlsEngine";
import { useLatestRef } from "@/hooks/useLatestRef";
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
  // Ad breaks of the current source; always detected, only auto-skipped when skipAds is on.
  const adRangesRef = useRef<AdRange[]>([]);

  const skipAdsRef = useRef(skipAds);

  const hlsRef = useRef<Hls | null>(null);

  // Read through refs so a new callback identity never tears down a playing hls.js instance.
  const onErrorRef = useLatestRef(onError);

  const onFallbackEmbedRef = useLatestRef(onFallbackEmbed);

  const [levels, setLevels] = useState<HlsQualityLevel[]>([]);

  const [subtitleTracks, setSubtitleTracks] = useState<HlsSubtitleTrack[]>([]);

  const [currentLevel, setCurrentLevel] = useState(-1);

  const [subtitleId, setSubtitleId] = useState(-1);

  useEffect(() => {
    skipAdsRef.current = skipAds;
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

    const detectNatively = () => {
      const controller = new AbortController();

      void detectAdRangesFromUrl(src, controller.signal)
        .then((ranges) => {
          adRangesRef.current = ranges;
        })
        .catch(() => {});

      return controller;
    };

    if (shouldUseNativeHls(video)) {
      video.src = src;

      const adDetection = detectNatively();

      const onMeta = () => {
        if (startPosition >= 0) {
          video.currentTime = startPosition;

          if (pendingSeekRef) pendingSeekRef.current = null;
        }
      };

      video.addEventListener("loadedmetadata", onMeta);

      return () => {
        adDetection.abort();

        video.removeEventListener("loadedmetadata", onMeta);

        video.removeAttribute("src");

        video.load();
      };
    }

    if (!Hls.isSupported()) {
      video.src = src;

      const adDetection = detectNatively();

      return () => {
        adDetection.abort();

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

    attachHlsAdDetection(hls, (ranges) => {
      adRangesRef.current = ranges;
    });

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
        } catch {}
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
          console.warn("[HLS] recoverMediaError threw, falling back");
        }
      }

      if (embedSrc) {
        if (pendingSeekRef) pendingSeekRef.current = null;

        onFallbackEmbedRef.current?.();

        dispatch({ type: "setHasError", hasError: false });

        dispatch({ type: "setUseEmbed", useEmbed: true });

        return;
      }

      dispatch({ type: "setHasError", hasError: true });

      onErrorRef.current?.();
    });

    return () => {
      hlsRef.current = null;

      hls.destroy();
    };
  }, [src, embedSrc, useEmbed, onErrorRef, videoRef, dispatch, pendingSeekRef, onFallbackEmbedRef]);

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
