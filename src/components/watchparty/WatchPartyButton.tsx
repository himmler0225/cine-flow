import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PartyPopper, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { watchPartyApi } from "@/services/platform/watchParty.service";
import { useAuthStore } from "@/store/authStore";
import { usePremium } from "@/hooks/usePremium";
import { generateRoomCode } from "@/lib/watchParty/watchParty";
import { cn } from "@/lib/utils";
import { CreateRoomModal } from "./CreateRoomModal";
import { WatchPartySetupDialog } from "./WatchPartySetupDialog";

interface WatchPartyButtonProps {
  movieSlug: string;
  movieName: string;
  thumb?: string;
  episodeName?: string;
  serverIndex?: number;
  className?: string;
}

export function WatchPartyButton({
  movieSlug,
  movieName,
  thumb,
  episodeName,
  serverIndex = 0,
  className,
}: WatchPartyButtonProps) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  const [setupOpen, setSetupOpen] = useState(false);

  const [createdOpen, setCreatedOpen] = useState(false);

  const [code, setCode] = useState("");

  const { isAuthenticated, user, profile, requestAuth } = useAuthStore();

  const { partyHours } = usePremium();

  const navigate = useNavigate();

  const openSetup = () => {
    if (!isAuthenticated || !user) {
      toast.info(t("watchparty.loginRequired"));

      requestAuth("login");

      return;
    }

    setSetupOpen(true);
  };

  const create = async (opts: { isPrivate: boolean; pin: string | null }) => {
    if (!user) return;

    setLoading(true);

    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const newCode = generateRoomCode();

        const username =
          profile?.username ??
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split("@")[0] ??
          t("watchparty.guest");

        const { data: room, error } = await watchPartyApi.createRoom({
          code: newCode,
          hostId: user.id,
          movieSlug,
          movieName,
          thumbUrl: thumb,
          episodeName: episodeName || t("watchparty.episodeDefault"),
          serverIndex,
          expiresHours: partyHours,
          isPrivate: opts.isPrivate,
          pin: opts.pin,
        });

        if (!error && room) {
          await watchPartyApi.insertMessage(
            room.id,
            username,
            t("watchparty.roomCreatedMsg", {
              username,
              private: opts.isPrivate ? t("watchparty.privateSuffix") : "",
            }),
            "system",
          );

          setCode(newCode);

          setSetupOpen(false);

          setCreatedOpen(true);

          return;
        }

        if (error) {
          const isDup = error.message.toLowerCase().includes("duplicate") || error.code === "23505";

          if (!isDup) {
            toast.error(t("watchparty.createFailed"), {
              description: `[${error.code ?? "?"}] ${error.message}`,
              duration: 8000,
            });

            return;
          }
        }
      }

      toast.error(t("watchparty.codeGenFailed"), {
        description: t("watchparty.codeGenFailedDesc"),
      });
    } catch (e) {
      const err = e as {
        message?: string;
        code?: string;
      };

      toast.error(t("watchparty.unknownError"), {
        description: err.message ?? String(e),
        duration: 8000,
      });
    } finally {
      setLoading(false);
    }
  };

  const start = () => {
    setCreatedOpen(false);

    navigate({ to: "/watch-party/$code", params: { code } });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={openSetup}
        disabled={loading}
        className={cn(
          "h-auto min-h-11 border-netflix-red/40 bg-netflix-red/10 px-4 py-2.5 text-netflix-red hover:bg-netflix-red hover:text-white disabled:cursor-not-allowed",
          className,
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PartyPopper className="h-4 w-4" />
        )}
        {loading ? t("watchparty.creatingRoom") : t("watchparty.watchWithFriends")}
      </Button>

      <WatchPartySetupDialog
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        movieName={movieName}
        onConfirm={(opts) => void create(opts)}
        loading={loading}
      />

      <CreateRoomModal
        open={createdOpen}
        onClose={() => setCreatedOpen(false)}
        code={code}
        movieName={movieName}
        thumb={thumb}
        onStart={start}
      />
    </>
  );
}
