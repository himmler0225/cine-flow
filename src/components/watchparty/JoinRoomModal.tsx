import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogIn, Loader2, Hash } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROOM_CODE_INVALID_PATTERN } from "@/constants/patterns";
import { watchPartyApi } from "@/services/platform/watchParty.service";

interface JoinRoomModalProps {
  open: boolean;
  onClose: () => void;
}

export function JoinRoomModal({ open, onClose }: JoinRoomModalProps) {
  const { t } = useTranslation();

  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleClose = () => {
    if (!loading) {
      setCode("");

      onClose();
    }
  };

  const join = async () => {
    const c = code.trim().toUpperCase();

    if (c.length !== 6) return toast.error(t("watchparty.roomCodeHint"));

    setLoading(true);

    const { data, error } = await watchPartyApi.fetchRoomPreview(c);

    setLoading(false);

    if (error) {
      return toast.error(t("watchparty.joinFailed"), {
        description: `[${error.code ?? "?"}] ${error.message}`,
        duration: 6000,
      });
    }

    if (!data) {
      return toast.error(t("watchparty.roomNotFoundShort"), {
        description: t("watchparty.roomNotFoundJoinDesc", { code: c }),
      });
    }

    if (new Date(data.expires_at).getTime() < Date.now()) {
      return toast.error(t("watchparty.roomExpiredShort"), {
        description: t("watchparty.roomExpiredJoinDesc"),
      });
    }

    handleClose();

    navigate({ to: "/watch-party/$code", params: { code: c } });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm border-white/10 bg-[#1a1a1a] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <LogIn className="h-5 w-5 text-netflix-red" />
            {t("watchparty.joinRoomTitle")}
          </DialogTitle>
          <DialogDescription className="text-netflix-muted">
            {t("watchparty.joinRoomDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="watchparty-join-code"
              className="text-xs font-medium uppercase tracking-wider text-netflix-muted"
            >
              {t("watchparty.roomCode")}
            </Label>
            <div className="relative">
              <Hash
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-netflix-muted"
                aria-hidden="true"
              />
              <Input
                id="watchparty-join-code"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase().replace(ROOM_CODE_INVALID_PATTERN, "").slice(0, 6),
                  )
                }
                onKeyDown={(e) => e.key === "Enter" && code.length === 6 && join()}
                placeholder="XXXXXX"
                disabled={loading}
                autoFocus
                aria-label={t("watchparty.roomCode")}
                className="border-white/15 bg-black/40 pl-9 text-center text-xl font-bold tracking-[0.5em] text-white placeholder:text-white/20 focus-visible:border-netflix-red focus-visible:ring-0 disabled:opacity-60"
              />
            </div>
            <p className="text-right text-[11px] text-netflix-muted">{code.length}/6</p>
          </div>

          <Button
            onClick={join}
            disabled={loading || code.length !== 6}
            className="w-full bg-netflix-red hover:bg-netflix-red/80 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("watchparty.joining")}
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" /> {t("watchparty.enterRoom")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
