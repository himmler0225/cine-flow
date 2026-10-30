import { useCallback, useEffect, useRef, useState } from "react";

export type SleepMode = "off" | 15 | 30 | 60 | "episode";

/**
 * Pauses playback after N minutes or when the current episode ends (and then
 * doesn't roll into the next one). Reset to "off" once it fires.
 */
export function useSleepTimer(onSleep: () => void) {
  const [mode, setModeState] = useState<SleepMode>("off");

  const [endsAt, setEndsAt] = useState<number | null>(null);

  const [, tick] = useState(0);

  const onSleepRef = useRef(onSleep);

  onSleepRef.current = onSleep;

  const modeRef = useRef<SleepMode>("off");

  const setMode = useCallback((next: SleepMode) => {
    modeRef.current = next;

    setModeState(next);

    setEndsAt(typeof next === "number" ? Date.now() + next * 60_000 : null);
  }, []);

  const fire = useCallback(() => {
    setMode("off");

    onSleepRef.current();
  }, [setMode]);

  useEffect(() => {
    if (endsAt == null) return;

    const timeout = window.setTimeout(fire, Math.max(0, endsAt - Date.now()));

    // Re-render every 30s so the remaining-time label stays current.
    const interval = window.setInterval(() => tick((n) => n + 1), 30_000);

    return () => {
      window.clearTimeout(timeout);

      window.clearInterval(interval);
    };
  }, [endsAt, fire]);

  /** Call from the video's "ended": returns true when the timer consumed it. */
  const handleEnded = useCallback(() => {
    if (modeRef.current !== "episode") return false;

    fire();

    return true;
  }, [fire]);

  const minutesLeft =
    endsAt == null ? null : Math.max(1, Math.ceil((endsAt - Date.now()) / 60_000));

  return { mode, setMode, minutesLeft, handleEnded };
}
