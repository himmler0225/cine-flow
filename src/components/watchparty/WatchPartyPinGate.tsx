import { useState } from "react";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { markPinVerified, verifyRoomPin } from "@/lib/watchParty/watchPartyPin";

interface WatchPartyPinGateProps {
  code: string;
  roomPin: string;
  onVerified: () => void;
}

export function WatchPartyPinGate({ code, roomPin, onVerified }: WatchPartyPinGateProps) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (pin.length < 4) {
      setError(t("watchparty.pinMinLength"));
      return;
    }
    if (!verifyRoomPin(roomPin, pin)) {
      setError(t("watchparty.pinIncorrect"));
      return;
    }
    markPinVerified(code);
    onVerified();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-netflix-black px-4 pt-16">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-netflix-red/20">
            <Lock className="h-6 w-6 text-netflix-red" />
          </div>
        </div>
        <h2 className="text-center text-lg font-bold text-white">{t("watchparty.privateRoom")}</h2>
        <p className="mt-1 text-center text-sm text-netflix-muted">
          {t("watchparty.enterPinForRoom", { code })}
        </p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="••••"
          className="mt-4 w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-white placeholder:text-white/20 focus:border-netflix-red focus:outline-none"
        />
        {error && <p className="mt-2 text-center text-sm text-red-400">{error}</p>}
        <Button onClick={submit} className="mt-4 w-full bg-netflix-red hover:bg-netflix-red-hover">
          {t("watchparty.enterRoom")}
        </Button>
      </div>
    </div>
  );
}
