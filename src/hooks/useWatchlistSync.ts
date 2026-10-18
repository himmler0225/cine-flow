import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useAuthStore } from "@/store/authStore";
import { defaultWatchlists, useWatchlistStore } from "@/store/watchlistStore";
import { watchlistApi } from "@/services/platform/watchlist.service";

export function useWatchlistSync() {
  const userId = useAuthStore((s) => s.user?.id);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      hydratedRef.current = false;

      useWatchlistStore.getState().replaceLists(defaultWatchlists());

      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const remote = await watchlistApi.fetch();

        if (cancelled) return;

        useWatchlistStore.getState().replaceLists(remote.length > 0 ? remote : defaultWatchlists());

        hydratedRef.current = true;
      } catch (error) {
        // Not hydrated: never save in-memory defaults over lists we could not read.
        console.warn("[watchlist] fetch failed during hydration", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!userId) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    let snapshot = useWatchlistStore.getState().lists;

    const unsub = useWatchlistStore.subscribe((state) => {
      // The server copy arriving is not a user edit; remember it as the rollback point.
      if (!hydratedRef.current) {
        snapshot = state.lists;

        return;
      }

      clearTimeout(timer);

      timer = setTimeout(async () => {
        const next = useWatchlistStore.getState().lists;

        try {
          await watchlistApi.save(next);

          snapshot = next;
        } catch {
          useWatchlistStore.getState().replaceLists(snapshot);

          toast.error(t("toast.watchlistSaveFailed"));
        }
      }, 800);
    });

    return () => {
      unsub();

      clearTimeout(timer);
    };
  }, [userId]);
}
