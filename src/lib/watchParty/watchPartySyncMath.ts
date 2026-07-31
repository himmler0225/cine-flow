export type PlaybackSnapshot = {
  is_playing: boolean;
  playback_time: number;
  saved_at: number;
};

export function projectedTime(snap: PlaybackSnapshot, now = Date.now()): number {
  if (!snap.is_playing) return snap.playback_time;
  const elapsed = (now - snap.saved_at) / 1000;
  return Math.max(0, snap.playback_time + elapsed);
}

export function shouldResync(localTime: number, hostTime: number, thresholdSec = 2): boolean {
  return Math.abs(localTime - hostTime) > thresholdSec;
}
