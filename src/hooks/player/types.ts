export interface UseVideoPlayerOptions {
  src: string;
  embed?: string;
  initialTime?: number;
  onEnded?: () => void;
  onError?: () => void;
  onProgress?: (currentSec: number, durationSec: number) => void;
  onResumeApplied?: (sec: number) => void;
  onNextEpisode?: () => void;
}
