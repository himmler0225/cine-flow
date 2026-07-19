import { useTranslation } from "react-i18next";

type Props = {
  disabled: boolean;
  onGuestPlay: () => void;
};

export function GuestOnlyOverlay({ disabled, onGuestPlay }: Props) {
  const { t } = useTranslation();
  if (!disabled) return null;

  const allowGuestButton = (target: EventTarget | null) =>
    target instanceof HTMLElement && !!target.closest("[data-guest-play-button]");

  return (
    <div
      className="absolute inset-0 z-10 cursor-not-allowed"
      title={t("watchparty.hostOnlyTitle")}
      onPointerDownCapture={(e) => {
        if (allowGuestButton(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      onClickCapture={(e) => {
        if (allowGuestButton(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        data-guest-play-button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onGuestPlay();
        }}
        className="absolute bottom-3 left-3 rounded bg-white/20 px-2 py-1 text-[11px] text-white hover:bg-white/30"
      >
        {t("watchparty.tapToPlaySync")}
      </button>
      <div className="pointer-events-none absolute right-3 top-3 rounded bg-black/80 px-2 py-1 text-[11px] text-white/80 ring-1 ring-white/20">
        {t("watchparty.hostOnlyBadge")}
      </div>
    </div>
  );
}
