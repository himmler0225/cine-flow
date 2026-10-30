import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/formatTime";
import type { DanmakuSettings } from "@/services/platform/preferences.service";
import type { SkipKind } from "@/services/platform/skipMarkers.service";
import type { ActiveSegment } from "@/hooks/player/useSkipMarkers";

const DENSITIES = ["low", "medium", "high"] as const;

interface Props {
  danmaku?: {
    settings: DanmakuSettings;
    onChange: (patch: DanmakuSettings) => void;
  };
  skip?: {
    intro: ActiveSegment | null;
    outro: ActiveSegment | null;
    autoSkipIntro: boolean;
    onAutoSkipIntroChange: (v: boolean) => void;
    getTime: () => number;
    duration: number;
    onMark: (kind: SkipKind, start: number, end: number) => Promise<void>;
    onUnmark: (kind: SkipKind) => Promise<void>;
  };
  onOpenChange?: (open: boolean) => void;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5 text-sm text-white">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-netflix-red" : "bg-white/25",
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}

function SegmentEditor({
  kind,
  current,
  getTime,
  duration,
  onMark,
  onUnmark,
}: {
  kind: SkipKind;
  current: ActiveSegment | null;
  getTime: () => number;
  duration: number;
  onMark: (kind: SkipKind, start: number, end: number) => Promise<void>;
  onUnmark: (kind: SkipKind) => Promise<void>;
}) {
  const { t } = useTranslation();

  const [start, setStart] = useState<number | null>(current?.mine ? current.start : null);

  const [end, setEnd] = useState<number | null>(
    current?.mine ? current.end : kind === "outro" && duration > 0 ? duration : null,
  );

  const [busy, setBusy] = useState(false);

  const valid = start != null && end != null && end - start >= 3 && end - start <= 600;

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);

    try {
      await fn();

      toast.success(ok);
    } catch {
      toast.error(t("player.skipMarkFailed"));
    } finally {
      setBusy(false);
    }
  };

  const point = (label: string, value: number | null, set: (v: number) => void) => (
    <div className="flex items-center justify-between gap-2 text-xs text-white/80">
      <span>
        {label}:{" "}
        <span className="tabular-nums text-white">{value != null ? formatTime(value) : "—"}</span>
      </span>
      <button
        type="button"
        onClick={() => set(Math.round(getTime() * 10) / 10)}
        className="rounded bg-white/10 px-2 py-1 text-[11px] text-white hover:bg-white/20"
      >
        {t("player.useCurrentTime")}
      </button>
    </div>
  );

  return (
    <div className="space-y-1.5 rounded-lg bg-white/5 p-2">
      <div className="flex items-center justify-between text-xs font-semibold text-white">
        <span>{kind === "intro" ? t("player.markIntro") : t("player.markOutro")}</span>
        {current && (
          <span className="font-normal text-white/60">
            {current.mine
              ? t("player.skipMarkMine")
              : t("player.skipMarkVotes", { count: current.votes })}
          </span>
        )}
      </div>
      {point(t("player.segmentStart"), start, setStart)}
      {point(t("player.segmentEnd"), end, setEnd)}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={!valid || busy}
          onClick={() => void run(() => onMark(kind, start!, end!), t("player.skipMarkSaved"))}
          className="flex-1 rounded bg-netflix-red px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          {t("common.save")}
        </button>
        {current?.mine && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await onUnmark(kind);

                setStart(null);

                setEnd(kind === "outro" && duration > 0 ? duration : null);
              }, t("player.skipMarkRemoved"))
            }
            className="rounded bg-white/10 px-2 py-1.5 text-xs text-white hover:bg-white/20"
          >
            {t("player.skipMarkRemove")}
          </button>
        )}
      </div>
    </div>
  );
}

/** Gear menu: comment overlay options and community intro/outro marking. */
export function PlayerSettingsMenu({ danmaku, skip, onOpenChange }: Props) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const [blockedDraft, setBlockedDraft] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);

  const setOpenState = (v: boolean) => {
    setOpen(v);

    onOpenChange?.(v);
  };

  useEffect(() => {
    if (!open) return;

    setBlockedDraft((danmaku?.settings.blocked ?? []).join(", "));

    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenState(false);
    };

    document.addEventListener("pointerdown", onDown);

    return () => document.removeEventListener("pointerdown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!danmaku && !skip) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpenState(!open)}
        className="rounded p-1.5 hover:bg-white/10"
        aria-label={t("player.settings")}
        aria-expanded={open}
      >
        <Settings2 className="h-5 w-5" />
      </button>
      {open && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-full right-0 mb-2 max-h-[min(26rem,70vh)] w-[min(18rem,85vw)] space-y-3 overflow-y-auto rounded-xl bg-black/95 p-3 text-left ring-1 ring-white/10"
        >
          {danmaku && (
            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
                {t("player.danmaku")}
              </h3>
              <Toggle
                label={t("player.danmakuShow")}
                checked={danmaku.settings.enabled !== false}
                onChange={(enabled) => danmaku.onChange({ enabled })}
              />
              <label className="block py-1 text-sm text-white">
                <span className="flex justify-between">
                  {t("player.danmakuOpacity")}
                  <span className="tabular-nums text-white/60">
                    {Math.round((danmaku.settings.opacity ?? 0.9) * 100)}%
                  </span>
                </span>
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.1}
                  value={danmaku.settings.opacity ?? 0.9}
                  onChange={(e) => danmaku.onChange({ opacity: Number(e.target.value) })}
                  className="mt-1 w-full accent-netflix-red"
                />
              </label>
              <div className="py-1 text-sm text-white">
                {t("player.danmakuDensity")}
                <div className="mt-1 grid grid-cols-3 gap-1">
                  {DENSITIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => danmaku.onChange({ density: d })}
                      className={cn(
                        "rounded py-1 text-xs",
                        (danmaku.settings.density ?? "medium") === d
                          ? "bg-netflix-red text-white"
                          : "bg-white/10 text-white/80 hover:bg-white/20",
                      )}
                    >
                      {t(`player.density.${d}`)}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block py-1 text-sm text-white">
                {t("player.danmakuBlocked")}
                <input
                  value={blockedDraft}
                  onChange={(e) => setBlockedDraft(e.target.value)}
                  onBlur={() =>
                    danmaku.onChange({
                      blocked: blockedDraft
                        .split(",")
                        .map((w) => w.trim())
                        .filter(Boolean)
                        .slice(0, 50),
                    })
                  }
                  placeholder={t("player.danmakuBlockedPlaceholder")}
                  className="mt-1 w-full rounded bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </label>
            </section>
          )}
          {skip && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
                {t("player.introOutro")}
              </h3>
              <Toggle
                label={t("player.autoSkipIntro")}
                checked={skip.autoSkipIntro}
                onChange={skip.onAutoSkipIntroChange}
              />
              <p className="text-[11px] leading-snug text-white/50">{t("player.skipMarkHint")}</p>
              <SegmentEditor
                kind="intro"
                current={skip.intro}
                getTime={skip.getTime}
                duration={skip.duration}
                onMark={skip.onMark}
                onUnmark={skip.onUnmark}
              />
              <SegmentEditor
                kind="outro"
                current={skip.outro}
                getTime={skip.getTime}
                duration={skip.duration}
                onMark={skip.onMark}
                onUnmark={skip.onUnmark}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
