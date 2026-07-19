import { useState } from "react";
import { Copy, Check, PartyPopper, Share2 } from "lucide-react";
import { toast } from "sonner";
import { UI_DELAY_MS } from "@/constants/timing";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildRoomUrl } from "@/lib/watchParty/watchParty";

interface Props {
  open: boolean;
  onClose: () => void;
  code: string;
  movieName: string;
  thumb?: string;
  onStart: () => void;
}

export function CreateRoomModal({ open, onClose, code, movieName, thumb, onStart }: Props) {
  const { t } = useTranslation();
  const url = buildRoomUrl(code);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(t("watchparty.inviteText", { movie: movieName, url }));
      setCopied(true);
      toast.success(t("toast.copyInvite"));
      window.setTimeout(() => setCopied(false), UI_DELAY_MS.copyFeedback);
    } catch {
      toast.error(t("toast.copyFailedShort"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-white/10 bg-[#1a1a1a] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <PartyPopper className="h-5 w-5 text-netflix-red" />
            {t("watchparty.roomCreated")}
          </DialogTitle>
          <DialogDescription className="text-netflix-muted">
            {t("watchparty.inviteFriendsHint")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {thumb && (
            <div className="overflow-hidden rounded-lg">
              <img src={thumb} alt={movieName} className="h-28 w-full object-cover" />
            </div>
          )}

          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-netflix-muted">
              {t("watchparty.movieLabel")}
            </p>
            <p className="font-semibold text-white">{movieName}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-netflix-muted">
              {t("watchparty.roomCodeLabel")}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-3xl font-extrabold tracking-[0.45em] text-netflix-red">
                {code}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={copy}
                className="border-white/15 bg-transparent text-white hover:bg-white/10"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" /> {t("watchparty.copied")}
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" /> {t("watchparty.copyLink")}
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 truncate text-xs text-netflix-muted">{url}</p>
          </div>

          <Button
            onClick={onStart}
            className="w-full bg-netflix-red py-5 text-base font-semibold hover:bg-netflix-red/80"
          >
            {t("watchparty.startWatching")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
