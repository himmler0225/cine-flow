import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bell, BellRing, CalendarClock, Share2 } from "lucide-react";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { watchPartyApi } from "@/services/platform/watchParty.service";
import { buildRoomUrl } from "@/lib/watchParty/watchParty";
import { formatRoomStart, shareRoomInvite } from "@/lib/watchParty/shareInvite";
import { getImageUrl } from "@/lib/movie/movieImages";
import type { WatchRoom } from "@/types/watchParty";

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(id);
  }, []);

  const left = Math.max(0, Math.floor((targetMs - now) / 1000));

  return {
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
  };
}

/** Lobby for a scheduled room before it starts: countdown, reminder, invite, early entry. */
export function WatchPartyScheduledGate({
  room,
  onEnter,
}: {
  room: WatchRoom;
  onEnter: () => void;
}) {
  const { t } = useTranslation();

  const qc = useQueryClient();

  const startsAt = room.scheduled_at!;

  const { days, hours, minutes, seconds } = useCountdown(Date.parse(startsAt));

  const startLabel = formatRoomStart(startsAt);

  const { data: reminders = [] } = useQuery({
    queryKey: queryKeys.watchParty.reminders(),
    queryFn: () => watchPartyApi.myReminders(),
    staleTime: 30_000,
  });

  const reminded = reminders.some((r) => r.room.id === room.id);

  const [busy, setBusy] = useState(false);

  const toggleReminder = async () => {
    setBusy(true);

    try {
      if (reminded) await watchPartyApi.cancelReminder(room.id);
      else {
        await watchPartyApi.remindMe(room.id);

        toast.success(t("watchparty.reminderOn"));
      }

      await qc.invalidateQueries({ queryKey: queryKeys.watchParty.reminders() });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const url = buildRoomUrl(room.code);

    const movie = room.title || room.movie_name || room.movie_slug;

    const result = await shareRoomInvite({
      title: movie,
      text: t("watchparty.inviteTextScheduled", { movie, time: startLabel, url }),
      url,
    });

    if (result === "copied") toast.success(t("toast.copyInvite"));
    else if (result === "failed") toast.error(t("toast.copyFailedShort"));
  };

  const units = [
    ...(days > 0 ? [[days, "d"] as const] : []),
    [hours, "h"] as const,
    [minutes, "m"] as const,
    [seconds, "s"] as const,
  ];

  const thumb = room.thumb_url ? getImageUrl(room.thumb_url) : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-netflix-black px-4 pb-10 pt-20">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        {thumb && <img src={thumb} alt="" className="h-40 w-full object-cover" />}
        <div className="space-y-5 p-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <CalendarClock className="h-4 w-4" /> {t("watchparty.scheduledBadge")}
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">
              {room.title || room.movie_name || room.movie_slug}
            </h1>
            {room.title && room.movie_name && (
              <p className="text-sm text-netflix-muted">{room.movie_name}</p>
            )}
            <p className="mt-1 text-sm text-netflix-text">
              {t("watchparty.startsAt", { time: startLabel })}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-netflix-muted">
              {t("watchparty.startsIn")}
            </p>
            <div className="flex gap-2" aria-live="polite">
              {units.map(([value, unit]) => (
                <div key={unit} className="min-w-14 flex-1 rounded-lg bg-black/40 py-2 text-center">
                  <span className="block font-mono text-2xl font-bold tabular-nums text-white">
                    {String(value).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase text-netflix-muted">{unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void toggleReminder()}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold ring-1 transition-colors disabled:opacity-60 ${
                reminded
                  ? "bg-amber-400/15 text-amber-200 ring-amber-300/40"
                  : "bg-white/5 text-white ring-white/15 hover:bg-white/10"
              }`}
            >
              {reminded ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {reminded ? t("watchparty.reminded") : t("watchparty.remindMe")}
            </button>
            <button
              type="button"
              onClick={() => void share()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/10"
            >
              <Share2 className="h-4 w-4" /> {t("watchparty.shareInvite")}
            </button>
          </div>

          <button
            type="button"
            onClick={onEnter}
            className="w-full rounded-lg bg-netflix-red py-3 text-sm font-semibold text-white hover:bg-netflix-red-hover"
          >
            {t("watchparty.enterNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
