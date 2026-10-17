export interface UseVideoPlayerOptions {
  src: string;
  embed?: string;
  initialTime?: number;
  onEnded?: () => void;
  onError?: () => void;
  onProgress?: (currentSec: number, durationSec: number) => void;
  onLiveTime?: (currentSec: number, durationSec: number) => void;
  onResumeApplied?: (sec: number) => void;
  onNextEpisode?: () => void;
  /** Movie slug: per-movie player preferences (speed) are stored under it. */
  prefsKey?: string;
}
