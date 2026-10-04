import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/formatTime";

const KEY_STEP_SEC = 5;

interface Props {
  progress: number;
  buffered: number;
  duration: number;
  label: string;
  onSeek: (timeSec: number) => void;
  onScrubChange?: (scrubbing: boolean) => void;
}

/**
 * Pointer-driven seek bar. Replaces a 4px <input type="range">: on phones it was almost
 * impossible to hit, iOS ignores taps on a range track (only the thumb drags), and
 * timeupdate kept yanking the thumb back mid-drag. Tap or drag anywhere on a tall hit
 * area; the time preview follows the finger and the seek happens once, on release.
 */
export function SeekBar({ progress, buffered, duration, label, onSeek, onScrubChange }: Props) {
  // Measured element: the inset track, so 0% / 100% sit fully inside the player.
  const trackRef = useRef<HTMLDivElement>(null);

  const activePointerRef = useRef<number | null>(null);

  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const timeAt = (clientX: number) => {
    const el = trackRef.current;

    if (!el || !duration) return 0;

    const rect = el.getBoundingClientRect();

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));

    return ratio * duration;
  };

  const endScrub = (e: React.PointerEvent<HTMLDivElement>, commit: boolean) => {
    if (activePointerRef.current !== e.pointerId) return;

    activePointerRef.current = null;

    setScrubTime(null);

    onScrubChange?.(false);

    if (commit) onSeek(timeAt(e.clientX));
  };

  const shown = scrubTime ?? progress;

  const pct = duration ? Math.min(100, (shown / duration) * 100) : 0;

  const bufferedPct = duration ? Math.min(100, (buffered / duration) * 100) : 0;

  const scrubbing = scrubTime !== null;

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={formatTime(shown)}
      className="group/seek relative flex h-7 w-full cursor-pointer touch-none select-none items-center px-2 focus-visible:outline-none"
      onPointerDown={(e) => {
        if (!duration || (e.pointerType === "mouse" && e.button !== 0)) return;

        e.preventDefault();

        e.stopPropagation();

        activePointerRef.current = e.pointerId;

        e.currentTarget.setPointerCapture(e.pointerId);

        setScrubTime(timeAt(e.clientX));

        onScrubChange?.(true);
      }}
      onPointerMove={(e) => {
        if (activePointerRef.current === e.pointerId) setScrubTime(timeAt(e.clientX));
      }}
      onPointerUp={(e) => endScrub(e, true)}
      onPointerCancel={(e) => endScrub(e, false)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        const step =
          e.key === "ArrowLeft" || e.key === "ArrowDown"
            ? -KEY_STEP_SEC
            : e.key === "ArrowRight" || e.key === "ArrowUp"
              ? KEY_STEP_SEC
              : null;

        if (step !== null) onSeek(progress + step);
        else if (e.key === "Home") onSeek(0);
        else if (e.key === "End") onSeek(duration);
        else return;

        // Keep the player's global ←/→ (±10s) shortcut from seeking a second time.
        e.preventDefault();

        e.stopPropagation();
      }}
    >
      <div ref={trackRef} className="relative flex h-full w-full items-center">
        <div
          className={cn(
            "relative h-1 w-full overflow-hidden rounded-full bg-white/25 transition-[height] duration-150 group-focus-visible/seek:h-1.5",
            scrubbing ? "h-1.5" : "group-hover/seek:h-1.5",
          )}
        >
          <div
            className="absolute inset-y-0 left-0 bg-white/40"
            style={{ width: `${bufferedPct}%` }}
          />
          <div className="absolute inset-y-0 left-0 bg-netflix-red" style={{ width: `${pct}%` }} />
        </div>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-netflix-red shadow-md ring-2 ring-black/30 transition-transform duration-150 group-focus-visible/seek:ring-white",
            scrubbing && "scale-125",
          )}
          style={{ left: `${pct}%` }}
        />
        {scrubbing && (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-full mb-1.5 -translate-x-1/2 rounded bg-black/85 px-2 py-0.5 text-xs font-medium tabular-nums text-white ring-1 ring-white/10"
            style={{ left: `clamp(1.75rem, ${pct}%, calc(100% - 1.75rem))` }}
          >
            {formatTime(shown)}
          </div>
        )}
      </div>
    </div>
  );
}
