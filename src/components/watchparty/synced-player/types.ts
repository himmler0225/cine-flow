export interface SyncedPlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (t: number) => void;
  paused: () => boolean;
  currentTime: () => number;
  duration: () => number;
}

export interface SyncedPlayerProps {
  src: string;
  embed?: string;
  poster?: string;
  disabled?: boolean;
  onPlay?: (t: number) => void;
  onPause?: (t: number) => void;
  onSeek?: (t: number) => void;
  onProviderReady?: (
    info: {
      provider: import("@/lib/iframeSync").IframeProvider;
      supportsAuto: boolean;
    } | null,
  ) => void;
}
