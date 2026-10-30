import { useEffect, useRef, useState } from "react";
import type { DanmakuItem } from "@/services/platform/danmaku.service";
import type { DanmakuSettings } from "@/services/platform/preferences.service";
import { cn } from "@/lib/utils";

/** Seconds a comment takes to cross the screen. */
const TRAVEL_SEC = 8;

const LANE_GAP_PX = 24;

const MAX_ON_SCREEN = { low: 8, medium: 18, high: 40 } as const;

type Bullet = {
  key: string;
  text: string;
  lane: number;
  width: number;
  own: boolean;
};

let measureCtx: CanvasRenderingContext2D | null = null;

function measure(text: string, font: string) {
  measureCtx ??= document.createElement("canvas").getContext("2d");

  if (!measureCtx) return text.length * 9;

  measureCtx.font = font;

  return Math.ceil(measureCtx.measureText(text).width) + 8;
}

interface Props {
  items: DanmakuItem[];
  /** Comments the viewer just sent: shown immediately, outlined. */
  own: DanmakuItem[];
  time: number;
  playing: boolean;
  settings: DanmakuSettings;
}

/**
 * Bilibili-style scrolling comments. Comments are released as the playhead
 * passes their time (not when jumping/seeking), placed on the first free lane,
 * and dropped when every lane is busy or the density cap is reached.
 */
export function DanmakuLayer({ items, own, time, playing, settings }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const [bullets, setBullets] = useState<Bullet[]>([]);

  const lastTimeRef = useRef(time);

  const lanesRef = useRef<number[]>([]);

  const shownOwnRef = useRef(new Set<string>());

  const seqRef = useRef(0);

  const blocked = (settings.blocked ?? []).map((w) => w.trim().toLowerCase()).filter(Boolean);

  const cap = MAX_ON_SCREEN[settings.density ?? "medium"];

  const release = (batch: DanmakuItem[], isOwn: boolean) => {
    const el = ref.current;

    if (!el || batch.length === 0) return;

    const width = el.clientWidth;

    const small = width < 640;

    const laneHeight = small ? 24 : 32;

    const laneCount = Math.max(2, Math.floor((el.clientHeight * 0.75) / laneHeight));

    const font = `600 ${small ? 14 : 18}px Inter, system-ui, sans-serif`;

    const speed = width / TRAVEL_SEC; // px/s for the leading edge

    const lanes = lanesRef.current;

    lanes.length = laneCount;

    const now = performance.now();

    const next: Bullet[] = [];

    for (const item of batch) {
      const text = item.content;

      if (blocked.some((w) => text.toLowerCase().includes(w))) continue;

      const textWidth = measure(text, font);

      const lane = lanes.findIndex((free) => !free || free <= now);

      if (lane < 0 && !isOwn) continue;

      const chosen = lane < 0 ? 0 : lane;

      // The lane frees up once this comment's tail has moved clear of the right edge.
      lanes[chosen] = now + ((textWidth + LANE_GAP_PX) / speed) * 1000;

      next.push({
        key: `${item.id}-${++seqRef.current}`,
        text,
        lane: chosen,
        width: textWidth,
        own: isOwn,
      });
    }

    if (next.length === 0) return;

    setBullets((cur) => {
      const room = Math.max(0, cap - cur.length);

      const accepted = isOwn ? next : next.slice(0, room);

      return accepted.length ? [...cur, ...accepted] : cur;
    });
  };

  // Release comments the playhead just passed. A jump (seek) only moves the cursor.
  useEffect(() => {
    const last = lastTimeRef.current;

    lastTimeRef.current = time;

    const delta = time - last;

    if (!playing || delta <= 0 || delta > 3) return;

    const due = items.filter(
      (i) => i.playback_time > last && i.playback_time <= time && !shownOwnRef.current.has(i.id),
    );

    release(due, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);

  useEffect(() => {
    const fresh = own.filter((i) => !shownOwnRef.current.has(i.id));

    fresh.forEach((i) => shownOwnRef.current.add(i.id));

    release(fresh, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [own]);

  const small = typeof window !== "undefined" && (ref.current?.clientWidth ?? 1024) < 640;

  const laneHeight = small ? 24 : 32;

  return (
    <div
      ref={ref}
      aria-hidden
      // container-type lets each comment travel exactly the layer width (100cqw).
      className="pointer-events-none absolute inset-x-0 top-12 bottom-16 z-[15] sm:top-14 overflow-hidden [container-type:size]"
      style={{ opacity: settings.opacity ?? 0.9 }}
    >
      {bullets.map((b) => (
        <span
          key={b.key}
          onAnimationEnd={() => setBullets((cur) => cur.filter((x) => x.key !== b.key))}
          className={cn(
            "absolute left-full whitespace-nowrap font-semibold text-white [text-shadow:0_0_2px_#000,0_1px_3px_#000] text-sm sm:text-lg",
            b.own && "rounded px-1 ring-1 ring-netflix-red/80",
          )}
          style={
            {
              top: b.lane * laneHeight,
              "--cf-danmaku-dx": `calc(-100cqw - ${b.width}px)`,
              animation: `cf-danmaku-move ${TRAVEL_SEC}s linear forwards`,
              animationPlayState: playing ? "running" : "paused",
            } as React.CSSProperties
          }
        >
          {b.text}
        </span>
      ))}
    </div>
  );
}
