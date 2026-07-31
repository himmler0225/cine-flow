import { MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageCount: number;
  chatPanel: ReactNode;
};

export function WatchPartyMobileChat({ open, onOpenChange, messageCount, chatPanel }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <Button
        onClick={() => onOpenChange(true)}
        className="fixed bottom-5 left-5 z-40 rounded-full bg-netflix-red px-4 py-3 shadow-xl shadow-netflix-red/40 lg:hidden"
      >
        <MessageSquare className="h-4 w-4" /> {t("watchparty.chat")}
        {messageCount > 0 && (
          <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
            {messageCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="flex h-[85dvh] flex-col border-t border-white/10 bg-[#141414] p-0 lg:hidden"
        >
          <SheetHeader className="shrink-0 border-b border-white/10 px-4 py-3">
            <SheetTitle className="text-white">{t("watchparty.liveChat")}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 p-0">{chatPanel}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
