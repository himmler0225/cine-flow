import { Crown, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RoomMemberRow } from "@/types/watchParty";

interface Props {
  members: RoomMemberRow[];
  hostId: string;
  meId?: string;
  onlineIds: Set<string>;
}

export function MemberList({ members, hostId, meId, onlineIds }: Props) {
  const { t } = useTranslation();
  const sorted = [...members].sort((a, b) => {
    if (a.user_id === hostId) return -1;
    if (b.user_id === hostId) return 1;
    return 0;
  });
  const onlineCount = sorted.filter((m) => onlineIds.has(m.user_id)).length;
  return (
    <TooltipProvider delayDuration={300}>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <Users className="h-4 w-4 text-netflix-muted" />
            <span>{t("watchparty.memberCount", { count: sorted.length })}</span>
          </div>
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t("watchparty.onlineCount", { count: onlineCount })}
          </span>
        </div>

        <ul className="space-y-1">
          {sorted.map((m) => {
            const isHost = m.user_id === hostId;
            const isMe = m.user_id === meId;
            const online = onlineIds.has(m.user_id);
            const displayName = m.username || t("watchparty.guest");
            const initial = displayName.charAt(0).toUpperCase();
            return (
              <li
                key={m.user_id}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors",
                  isMe ? "bg-white/5" : "hover:bg-white/5",
                )}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.avatar_url ?? undefined} alt={displayName} />
                        <AvatarFallback className="bg-netflix-red text-xs font-bold text-white">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#141414]",
                          online ? "bg-emerald-500" : "bg-zinc-600",
                        )}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {online ? t("watchparty.online") : t("watchparty.offline")}
                  </TooltipContent>
                </Tooltip>

                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    online ? "text-white" : "text-white/50",
                  )}
                >
                  {displayName}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  {isHost && (
                    <Badge className="gap-0.5 border-amber-400/30 bg-amber-400/10 px-1.5 py-0 text-[10px] font-semibold text-amber-300 hover:bg-amber-400/10">
                      <Crown className="h-2.5 w-2.5" /> {t("watchparty.host")}
                    </Badge>
                  )}
                  {isMe && (
                    <Badge
                      variant="outline"
                      className="border-white/20 px-1.5 py-0 text-[10px] font-medium text-white/60"
                    >
                      {t("watchparty.you")}
                    </Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </TooltipProvider>
  );
}
