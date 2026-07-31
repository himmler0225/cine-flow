import { useMemo } from "react";
import { useLocation } from "@tanstack/react-router";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { isWatchFinished } from "@/utils/watchProgress";
import type { WatchHistoryItem } from "@/utils/localHistory";

const HIDDEN_PREFIXES = ["/watch/", "/watch-party/", "/admin"];

export function pickContinueWatchingItem(history: WatchHistoryItem[]): WatchHistoryItem | null {
  return (
    history.find(
      (h) =>
        h.duration_sec > 0 &&
        h.progress_sec >= 10 &&
        !isWatchFinished(h.progress_sec, h.duration_sec),
    ) ?? null
  );
}

export function isContinueWatchingBarHiddenOnPath(pathname: string): boolean {
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname === "/") return true;
  return false;
}

export function useContinueWatchingBar() {
  const location = useLocation();
  const { history, deleteItem } = useWatchHistory();
  const item = useMemo(() => pickContinueWatchingItem(history), [history]);
  const visible = !!item && !isContinueWatchingBarHiddenOnPath(location.pathname);
  return { item, visible, deleteItem };
}

export function useContinueWatchingBarVisible(): boolean {
  return useContinueWatchingBar().visible;
}
