import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type Props = {
  onBack: () => void;
};

export function WatchPartyClosedOverlay({ onBack }: Props) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1a1a1a] p-6 text-center">
        <div className="mb-3 text-5xl">🔴</div>
        <h3 className="text-lg font-bold text-white">{t("watchparty.roomClosedTitle")}</h3>
        <p className="mt-1 text-sm text-netflix-muted">{t("watchparty.roomClosedDesc")}</p>
        <Button onClick={onBack} className="mt-5 w-full bg-netflix-red hover:bg-netflix-red/80">
          {t("watchparty.backToMovie")}
        </Button>
      </div>
    </div>
  );
}
