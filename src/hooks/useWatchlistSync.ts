import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useAuthStore } from "@/store/authStore";
import { useWatchlistStore } from "@/store/watchlistStore";
import {
  fetchUserWatchlists,
  migrateLocalWatchlistsToSupabase,
  saveUserWatchlists,
} from "@/services/platform/watchlist.service";

/** Hydrate watchlists from Supabase when logged in; debounce saves on change. */
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
      await migrateLocalWatchlistsToSupabase(userId);
      if (cancelled) return;
      try {
        const remote = await fetchUserWatchlists(userId);
        if (!cancelled && remote.length > 0) {
          useWatchlistStore.getState().replaceLists(remote);
        }
      } catch {
        /* keep local */
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
    // Snapshot ngay trước khi debounce flush -> rollback chính xác nếu lỗi
    let snapshot = useWatchlistStore.getState().lists;
    const unsub = useWatchlistStore.subscribe((state) => {
      if (!hydratedRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const next = useWatchlistStore.getState().lists;
        try {
          await saveUserWatchlists(userId, next);
          snapshot = next;
        } catch {
          useWatchlistStore.getState().replaceLists(snapshot);
          toast.error(t("toast.watchlistSaveFailed"));
        }
      }, 800);
      // tham chiếu state để TS không bắt unused param
      void state;
    });

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [userId]);
}
