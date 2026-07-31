import { Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, LogOut, Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RoomCountdown } from "@/components/watchparty/RoomCountdown";
import type { WatchRoom } from "@/types/watchParty";

type Props = {
  room: WatchRoom;
  isHost: boolean;
  closing: boolean;
  onCopyInvite: () => void;
  onCloseRoom: () => void;
  onLeave: () => void;
};

export function WatchPartyRoomHeader({
  room,
  isHost,
  closing,
  onCopyInvite,
  onCloseRoom,
  onLeave,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <Button variant="ghost" size="sm" asChild className="text-netflix-muted hover:text-white">
        <Link to="/movie/$slug" params={{ slug: room.movie_slug }}>
          <ArrowLeft className="h-4 w-4" /> {t("watchparty.moviePage")}
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        <span className="rounded-md border border-netflix-red/40 bg-netflix-red/10 px-3 py-1 font-mono text-sm font-bold tracking-widest text-netflix-red">
          {room.code}
        </span>
        {room.is_private && (
          <span className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-netflix-muted">
            🔒 {t("watchparty.privateShort")}
          </span>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onCopyInvite}
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
            >
              <Copy className="h-3.5 w-3.5" /> {t("watchparty.invite")}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("watchparty.copyInvite")}</TooltipContent>
        </Tooltip>

        <RoomCountdown expiresAt={room.expires_at} />

        {isHost ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onCloseRoom}
                disabled={closing}
                className="border-red-500/40 bg-red-500/10 text-red-300 hover:border-red-500 hover:bg-red-500 hover:text-white"
              >
                {closing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {t("watchparty.closeRoom")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("watchparty.closeRoomAll")}</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onLeave}
                className="border-white/15 bg-transparent text-white hover:border-netflix-red hover:bg-netflix-red hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" /> {t("watchparty.leave")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("watchparty.leaveRoom")}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
