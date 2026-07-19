import { useTranslation } from "react-i18next";
import type { IframeSyncInfo } from "@/lib/iframeSync";
import { GuestOnlyOverlay } from "@/components/watchparty/synced-player/GuestOnlyOverlay";

type Props = {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  iframeInfo: IframeSyncInfo;
  disabled?: boolean;
  onGuestPlay: () => void;
};

export function SyncedIframeView({ iframeRef, iframeInfo, disabled, onGuestPlay }: Props) {
  const { t } = useTranslation();

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        ref={iframeRef}
        src={iframeInfo.url}
        title={t("watchparty.playerTitle")}
        id="kkflix-player"
        className="h-full w-full"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
      {!iframeInfo.supportsAuto && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-center text-xs text-amber-300">
          {t("watchparty.embedNoSyncHint")}
        </div>
      )}
      {disabled && iframeInfo.supportsAuto && (
        <GuestOnlyOverlay disabled onGuestPlay={onGuestPlay} />
      )}
    </div>
  );
}
