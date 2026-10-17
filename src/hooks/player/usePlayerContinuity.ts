import { useEffect, useRef } from "react";
import type { PlayerUiAction } from "@/hooks/player/playerReducer";
import { getMoviePrefs, getVolumePrefs } from "@/lib/player/playerPrefs";

/**
 * Keeps playback going across episodes. The <video> element survives episode changes (the
 * watch page used to remount the player per episode, which also dropped fullscreen), so:
 * - if the previous episode was playing or had just ended, the next one starts by itself
 *   (same element, so iOS still treats it as user-initiated);
 * - the movie's saved speed and the viewer's volume are re-applied to each new source.
 * Must run before usePlayerHlsSource so its cleanup reads the old element state before the
 * source is torn down.
 */
export function usePlayerContinuity(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string,
  prefsKey: string | undefined,
  dispatch: React.Dispatch<PlayerUiAction>,
) {
  const continueRef = useRef(false);

  useEffect(() => {
    const v = videoRef.current;

    if (!v || !src) return;

    const { speed } = getMoviePrefs(prefsKey);

    const { volume, muted } = getVolumePrefs();

    const onReady = () => {
      if (speed && speed !== v.playbackRate) {
        v.defaultPlaybackRate = speed;

        v.playbackRate = speed;

        dispatch({ type: "setSpeed", speed });
      }

      if (typeof volume === "number") {
        v.volume = volume;

        dispatch({ type: "setVolume", volume });
      }

      if (typeof muted === "boolean") {
        v.muted = muted;

        dispatch({ type: "setMuted", muted });
      }

      if (continueRef.current) {
        continueRef.current = false;

        void v.play().catch(() => {});
      }
    };

    v.addEventListener("loadedmetadata", onReady, { once: true });

    return () => {
      v.removeEventListener("loadedmetadata", onReady);

      continueRef.current = !v.paused || v.ended;
    };
  }, [src, prefsKey, videoRef, dispatch]);
}
