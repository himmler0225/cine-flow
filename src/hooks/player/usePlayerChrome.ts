import { useCallback, useEffect, useRef, useState } from "react";
import { PLAYER_SEEK_STEP_SEC, UI_DELAY_MS } from "@/constants/timing";

export type SeekFlash = {
  direction: -1 | 1;
  id: number;
};

type Args = {
  playing: boolean;
  /** Menu open, ad playing…: never auto-hide. */
  keepVisible: boolean;
  togglePlay: () => void;
  seekBy: (deltaSec: number) => void;
  toggleFullscreen: () => void;
};

/**
 * Visibility and gestures for the custom player controls.
 * - Mouse: moving over the player shows the controls; click toggles play, double-click
 *   toggles fullscreen.
 * - Touch: a tap shows/hides the controls (play/pause is the big centre button);
 *   double-tap on the left/right side seeks ∓10s.
 * Controls stay up while paused, scrubbing, or when `keepVisible`, and hide 3s after the
 * last interaction otherwise.
 */
export function usePlayerChrome({
  playing,
  keepVisible,
  togglePlay,
  seekBy,
  toggleFullscreen,
}: Args) {
  const [shown, setShown] = useState(true);

  const [touchUi, setTouchUi] = useState(false);

  const [seekFlash, setSeekFlash] = useState<SeekFlash | null>(null);

  const hideTimerRef = useRef<number | undefined>(undefined);

  const tapTimerRef = useRef<number | undefined>(undefined);

  const lastTapAtRef = useRef(0);

  const lastPointerTypeRef = useRef<string>("mouse");

  const scrubbingRef = useRef(false);

  const visible = shown || !playing || keepVisible;

  // Read by the delayed single-tap handler, which must see the state at fire time.
  const visibleRef = useRef(visible);

  visibleRef.current = visible;

  const playingRef = useRef(playing);

  playingRef.current = playing;

  const scheduleHide = useCallback(() => {
    window.clearTimeout(hideTimerRef.current);

    hideTimerRef.current = window.setTimeout(() => {
      if (!scrubbingRef.current) setShown(false);
    }, UI_DELAY_MS.playerControlsHide);
  }, []);

  const reveal = useCallback(() => {
    setShown(true);

    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    if (window.matchMedia?.("(pointer: coarse)").matches) setTouchUi(true);

    return () => {
      window.clearTimeout(hideTimerRef.current);

      window.clearTimeout(tapTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (playing) scheduleHide();
  }, [playing, scheduleHide]);

  useEffect(() => {
    if (!seekFlash) return;

    const id = window.setTimeout(() => setSeekFlash(null), UI_DELAY_MS.seekFlash);

    return () => window.clearTimeout(id);
  }, [seekFlash]);

  const onScrubChange = useCallback(
    (scrubbing: boolean) => {
      scrubbingRef.current = scrubbing;

      if (scrubbing) setShown(true);
      else scheduleHide();
    },
    [scheduleHide],
  );

  const onSurfacePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    lastPointerTypeRef.current = e.pointerType;

    if (e.pointerType === "mouse") {
      if (e.button !== 0) return;

      togglePlay();

      reveal();

      return;
    }

    setTouchUi(true);

    const rect = e.currentTarget.getBoundingClientRect();

    const zone = (e.clientX - rect.left) / rect.width;

    const now = Date.now();

    const isDoubleTap = now - lastTapAtRef.current < UI_DELAY_MS.doubleTap;

    lastTapAtRef.current = now;

    window.clearTimeout(tapTimerRef.current);

    if (isDoubleTap && (zone < 0.4 || zone > 0.6)) {
      const direction = zone < 0.5 ? -1 : 1;

      seekBy(direction * PLAYER_SEEK_STEP_SEC);

      setSeekFlash({ direction, id: now });

      return;
    }

    // Wait out the double-tap window before treating it as a single tap.
    tapTimerRef.current = window.setTimeout(() => {
      if (visibleRef.current && playingRef.current) {
        window.clearTimeout(hideTimerRef.current);

        setShown(false);
      } else {
        reveal();
      }
    }, UI_DELAY_MS.doubleTap);
  };

  return {
    visible,
    touchUi,
    seekFlash,
    reveal,
    onScrubChange,
    surfaceProps: {
      onPointerUp: onSurfacePointerUp,
      onDoubleClick: () => {
        if (lastPointerTypeRef.current === "mouse") toggleFullscreen();
      },
    },
    containerProps: {
      onPointerMove: (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") reveal();
      },
      onPointerLeave: (e: React.PointerEvent) => {
        if (e.pointerType === "mouse" && playing && !scrubbingRef.current) setShown(false);
      },
    },
  };
}
