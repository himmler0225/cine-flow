import type { IframeSyncInfo } from "@/lib/iframeSync";
import { GuestOnlyOverlay } from "@/components/watchparty/synced-player/GuestOnlyOverlay";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poster?: string;
  disabled?: boolean;
  onGuestPlay: () => void;
};

export function SyncedVideoView({ videoRef, poster, disabled, onGuestPlay }: Props) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        controls={!disabled}
        className="h-full w-full"
      />
      <GuestOnlyOverlay disabled={!!disabled} onGuestPlay={onGuestPlay} />
    </div>
  );
}
