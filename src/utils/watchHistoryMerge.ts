export interface WatchHistoryItem {
  id?: string;
  user_id?: string;
  movie_slug: string;
  movie_name: string;
  thumb_url?: string | null;
  episode_name: string;
  episode_index?: number;
  server_index: number;
  progress_sec: number;
  duration_sec: number;
  completed?: boolean;
  watched_at: string;
}

export function mergeWatchProgress(
  prev: WatchHistoryItem | undefined,
  next: WatchHistoryItem,
  nowIso = new Date().toISOString(),
): WatchHistoryItem {
  const progressSec = Math.max(0, Math.round(next.progress_sec));
  const durationSec = Math.max(0, Math.round(next.duration_sec));
  const prevProgress = prev?.progress_sec ?? 0;
  const resetToStart = progressSec <= 5;
  const finished =
    next.completed === true || (durationSec > 0 && progressSec / durationSec >= 0.95);
  return {
    ...prev,
    ...next,
    progress_sec: resetToStart || finished ? progressSec : Math.max(prevProgress, progressSec),
    duration_sec: Math.max(prev?.duration_sec ?? 0, durationSec),
    completed: finished || prev?.completed === true,
    watched_at: nowIso,
  };
}
