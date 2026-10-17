import { useState } from "react";
import { PartyPopper, Lock, CalendarClock } from "lucide-react";
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
import { toLocalInputValue } from "@/lib/watchParty/shareInvite";

export type WatchPartySetupOptions = {
  isPrivate: boolean;
  pin: string | null;
  scheduledAt: string | null;
  title: string | null;
};

/** The API accepts schedules up to 7 days ahead; keep a small margin on both ends. */
const MIN_LEAD_MS = 5 * 60_000;

const MAX_AHEAD_MS = 7 * 24 * 3600_000 - 3600_000;

interface Props {
  open: boolean;
  onClose: () => void;
  movieName: string;
  onConfirm: (opts: WatchPartySetupOptions) => void;
  loading?: boolean;
}

export function WatchPartySetupDialog({ open, onClose, movieName, onConfirm, loading }: Props) {
  const { t } = useTranslation();

  const { isPremium } = usePremium();

  const [isPrivate, setIsPrivate] = useState(false);

  const [pin, setPin] = useState("");

  const [scheduled, setScheduled] = useState(false);

  const [startLocal, setStartLocal] = useState("");

  const [title, setTitle] = useState("");

  const startDate = scheduled && startLocal ? new Date(startLocal) : null;

  const scheduleInvalid =
    scheduled &&
    (!startDate ||
      Number.isNaN(startDate.getTime()) ||
      startDate.getTime() - Date.now() < MIN_LEAD_MS ||
      startDate.getTime() - Date.now() > MAX_AHEAD_MS);

  const toggleScheduled = (on: boolean) => {
    setScheduled(on);

    if (on && !startLocal) {
      const next = new Date(Date.now() + 3600_000);

      next.setMinutes(0, 0, 0);

      setStartLocal(toLocalInputValue(next));
    }
  };

  const handleConfirm = () => {
    if (isPrivate && pin.trim().length < 4) return;

    if (scheduleInvalid) return;

    onConfirm({
      isPrivate,
      pin: isPrivate ? pin.trim() : null,
      scheduledAt: startDate ? startDate.toISOString() : null,
      title: title.trim() || null,
    });
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

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
            <input
              type="checkbox"
              checked={scheduled}
              onChange={(e) => toggleScheduled(e.target.checked)}
              className="mt-1 rounded border-white/20"
            />
            <div>
              <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                <CalendarClock className="h-3.5 w-3.5" /> {t("watchparty.scheduleToggle")}
              </span>
              <p className="mt-0.5 text-xs text-netflix-muted">{t("watchparty.scheduleHint")}</p>
            </div>
          </label>

          {scheduled && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-netflix-muted" htmlFor="wp-start">
                  {t("watchparty.startTimeLabel")}
                </label>
                <input
                  id="wp-start"
                  type="datetime-local"
                  value={startLocal}
                  min={toLocalInputValue(new Date(Date.now() + MIN_LEAD_MS))}
                  max={toLocalInputValue(new Date(Date.now() + MAX_AHEAD_MS))}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-base text-white [color-scheme:dark] focus:border-netflix-red focus:outline-none sm:text-sm"
                />
                {scheduleInvalid && startLocal && (
                  <p className="mt-1 text-xs text-red-400">{t("watchparty.scheduleInvalid")}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs text-netflix-muted" htmlFor="wp-title">
                  {t("watchparty.titleLabel")}
                </label>
                <input
                  id="wp-title"
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("watchparty.titlePlaceholder")}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-base text-white focus:border-netflix-red focus:outline-none sm:text-sm"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={loading || (isPrivate && pin.trim().length < 4) || scheduleInvalid}
            className="w-full bg-netflix-red py-5 text-base font-semibold hover:bg-netflix-red/80 disabled:opacity-50"
          >
            {loading ? t("watchparty.creating") : t("watchparty.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
