import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useAuthStore } from "@/store/authStore";
import { useWatchlistStore } from "@/store/watchlistStore";
import { watchlistApi } from "@/services/platform/watchlist.service";

export function useWatchlistSync() {
  const userId = useAuthStore((s) => s.user?.id);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      hydratedRef.current = false;

      return;
    }

    let cancelled = false;

    (async () => {
      await watchlistApi.migrateLocalToServer();

      if (cancelled) return;

      try {
        const remote = await watchlistApi.fetch();

        if (!cancelled && remote.length > 0) {
          useWatchlistStore.getState().replaceLists(remote);
        }
      } catch (error) {
        console.warn("[watchlist] fetch failed during hydration", error);
      }

      hydratedRef.current = true;
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
      if (!hydratedRef.current) return;

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

      void state;
    });

    return () => {
      unsub();

      clearTimeout(timer);
    };
  }, [userId]);
}
