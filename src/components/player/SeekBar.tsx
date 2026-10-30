import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/formatTime";
import type { MomentsHeatmap } from "@/services/platform/moments.service";

const KEY_STEP_SEC = 5;

interface Props {
  progress: number;
  buffered: number;
  duration: number;
  label: string;
  onSeek: (timeSec: number) => void;
  onScrubChange?: (scrubbing: boolean) => void;
  /** Reaction heatmap: drawn above the track, hot moments marked on it. */
  heatmap?: MomentsHeatmap;
}

const HEATMAP_HEIGHT = 18;

/** Area path over the track (viewBox 0..1000 x 0..HEATMAP_HEIGHT) from bucket scores. */
function heatmapPath(heatmap: MomentsHeatmap, duration: number): string | null {
  const max = Math.max(0, ...heatmap.buckets.map((b) => b.score));

  if (!duration || max <= 0) return null;

  const x = (sec: number) => Math.min(1000, Math.max(0, (sec / duration) * 1000));

  const y = (score: number) => HEATMAP_HEIGHT - (score / max) * (HEATMAP_HEIGHT - 2);

  const points = heatmap.buckets
    .filter((b) => b.start < duration)
    .map((b) => `L${x(b.start + heatmap.bucket_seconds / 2).toFixed(1)},${y(b.score).toFixed(1)}`);

  return `M0,${HEATMAP_HEIGHT} ${points.join(" ")} L1000,${HEATMAP_HEIGHT} Z`;
}

/**
 * Pointer-driven seek bar. Replaces a 4px <input type="range">: on phones it was almost
 * impossible to hit, iOS ignores taps on a range track (only the thumb drags), and
 * timeupdate kept yanking the thumb back mid-drag. Tap or drag anywhere on a tall hit
 * area; the time preview follows the finger and the seek happens once, on release.
 */
export function SeekBar({
  progress,
  buffered,
  duration,
  label,
  onSeek,
  onScrubChange,
  heatmap,
}: Props) {
  // Measured element: the inset track, so 0% / 100% sit fully inside the player.
  const trackRef = useRef<HTMLDivElement>(null);

  const activePointerRef = useRef<number | null>(null);

  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const timeAt = (e: { clientX: number; clientY: number }) => {
    const el = trackRef.current;

    if (!el || !duration) return 0;

    const rect = el.getBoundingClientRect();

    // A track taller than wide is rotated 90° (iPhone landscape fullscreen): its
    // length runs down the screen.
    const ratio = Math.min(
      1,
      Math.max(
        0,
        rect.height > rect.width
          ? (e.clientY - rect.top) / rect.height
          : (e.clientX - rect.left) / rect.width,
      ),
    );

    return ratio * duration;
  };

  const endScrub = (e: React.PointerEvent<HTMLDivElement>, commit: boolean) => {
    if (activePointerRef.current !== e.pointerId) return;

    activePointerRef.current = null;

    setScrubTime(null);

    onScrubChange?.(false);

    if (commit) onSeek(timeAt(e));
  };

  const shown = scrubTime ?? progress;

  const pct = duration ? Math.min(100, (shown / duration) * 100) : 0;

  const bufferedPct = duration ? Math.min(100, (buffered / duration) * 100) : 0;

  const scrubbing = scrubTime !== null;

  const graph = heatmap ? heatmapPath(heatmap, duration) : null;

  const hotMoments = (heatmap?.hot_moments ?? []).filter((m) => duration && m.start < duration);

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

        setScrubTime(timeAt(e));

        onScrubChange?.(true);
      }}
      onPointerMove={(e) => {
        if (activePointerRef.current === e.pointerId) setScrubTime(timeAt(e));
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
        {graph && (
          <svg
            aria-hidden
            viewBox={`0 0 1000 ${HEATMAP_HEIGHT}`}
            preserveAspectRatio="none"
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-1/2 mb-1 w-full transition-opacity",
              scrubbing ? "opacity-70" : "opacity-35 group-hover/seek:opacity-70",
            )}
            style={{ height: HEATMAP_HEIGHT }}
          >
            <path d={graph} className="fill-white" />
          </svg>
        )}
        {hotMoments.map((m) => (
          <span
            key={m.start}
            aria-hidden
            title={`${m.top_emoji ?? "🔥"} ${formatTime(m.start)}`}
            className="pointer-events-none absolute top-1/2 z-[1] h-2 w-0.5 -translate-y-1/2 rounded-full bg-amber-300"
            style={{ left: `${Math.min(100, (m.start / duration) * 100)}%` }}
          />
        ))}
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
