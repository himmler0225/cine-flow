import { useState } from "react";
import { PartyPopper, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";

interface Props {
  open: boolean;
  onClose: () => void;
  movieName: string;
  onConfirm: (opts: { isPrivate: boolean; pin: string | null }) => void;
  loading?: boolean;
}

export function WatchPartySetupDialog({ open, onClose, movieName, onConfirm, loading }: Props) {
  const { t } = useTranslation();

  const { isPremium } = usePremium();

  const [isPrivate, setIsPrivate] = useState(false);

  const [pin, setPin] = useState("");

  const handleConfirm = () => {
    if (isPrivate && pin.trim().length < 4) return;

    onConfirm({ isPrivate, pin: isPrivate ? pin.trim() : null });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-white/10 bg-[#1a1a1a] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <PartyPopper className="h-5 w-5 text-netflix-red" />
            {t("watchparty.createRoom")}
          </DialogTitle>
          <DialogDescription className="text-netflix-muted">
            {t("watchparty.watchMovieWith", { movieName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={!isPremium}
              className="mt-1 rounded border-white/20"
            />
            <div>
              <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                <Lock className="h-3.5 w-3.5" /> {t("watchparty.privateRoomPin")}
              </span>
              <p className="mt-0.5 text-xs text-netflix-muted">
                {isPremium ? t("watchparty.pinHintPremium") : t("watchparty.pinHintNeedPremium")}
              </p>
            </div>
          </label>

          {isPrivate && isPremium && (
            <div>
              <label className="mb-1 block text-xs text-netflix-muted">
                {t("watchparty.pinLabel")}
              </label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={t("watchparty.pinPlaceholder")}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-white focus:border-netflix-red focus:outline-none"
              />
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={loading || (isPrivate && pin.trim().length < 4)}
            className="w-full bg-netflix-red py-5 text-base font-semibold hover:bg-netflix-red/80 disabled:opacity-50"
          >
            {loading ? t("watchparty.creating") : t("watchparty.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
