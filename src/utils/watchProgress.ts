interface WatchProgressPercentOptions {
  clamp?: boolean;
}

export const WATCH_COMPLETION_RATIO = 0.95;

export function getWatchProgressPercent(
  progressSeconds: number,
  durationSeconds: number,
  options: WatchProgressPercentOptions = {},
): number {
  if (durationSeconds <= 0) return 0;
  const percent = Math.round((progressSeconds / durationSeconds) * 100);
  return options.clamp ? Math.min(100, percent) : percent;
}

export function isWatchFinished(progressSeconds: number, durationSeconds: number): boolean {
  if (durationSeconds <= 0) return false;
  return progressSeconds / durationSeconds >= WATCH_COMPLETION_RATIO;
}
