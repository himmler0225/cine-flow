import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { queryKeys } from "@/constants/queryKeys";
import { watchPartyApi } from "@/services/platform/watchParty.service";

/** Same lead time as the API's scheduler. */
const REMIND_BEFORE_MS = 5 * 60_000;

const POLL_MS = 60_000;

const SHOWN_KEY = "cineflow_wp_reminded";

function alreadyShown(roomId: string): boolean {
  try {
    return (sessionStorage.getItem(SHOWN_KEY) ?? "").split(",").includes(roomId);
  } catch {
    return false;
  }
}

function markShown(roomId: string): void {
  try {
    const ids = (sessionStorage.getItem(SHOWN_KEY) ?? "").split(",").filter(Boolean);

    sessionStorage.setItem(SHOWN_KEY, [...ids, roomId].slice(-50).join(","));
  } catch {}
}

/**
 * Site-wide reminder for watch parties the viewer asked to be reminded about. The API's
 * `reminder:due` push only reaches sockets inside a room, so the app polls its reminder list
 * and shows a toast once per room, 5 minutes before the start.
 */
export function useWatchPartyReminders(enabled: boolean) {
  const navigate = useNavigate();

  const { data: reminders = [] } = useQuery({
    queryKey: queryKeys.watchParty.reminders(),
    queryFn: () => watchPartyApi.myReminders(),
    enabled,
    refetchInterval: enabled ? POLL_MS : false,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!enabled) return;

    const timers = reminders
      .filter((r) => r.room.scheduled_at && !alreadyShown(r.room.id))
      .map(({ room }) => {
        const startsAt = Date.parse(room.scheduled_at!);

        const fireIn = Math.max(0, startsAt - REMIND_BEFORE_MS - Date.now());

        // Past the start by more than the API's grace window: skip.
        if (startsAt < Date.now() - 10 * 60_000) return undefined;

        return window.setTimeout(
          () => {
            if (alreadyShown(room.id)) return;

            markShown(room.id);

            toast(
              t("watchparty.roomStartingSoon", {
                title: room.title || room.movie_name || room.movie_slug,
              }),
              {
                duration: 15000,
                action: {
                  label: t("watchparty.joinRoom"),
                  onClick: () =>
                    void navigate({ to: "/watch-party/$code", params: { code: room.code } }),
                },
              },
            );
          },
          Math.min(fireIn, 2 ** 31 - 1),
        );
      });

    return () => timers.forEach((id) => id && window.clearTimeout(id));
  }, [enabled, reminders, navigate]);
}
