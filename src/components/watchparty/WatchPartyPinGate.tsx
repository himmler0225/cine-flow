import { useState } from "react";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface WatchPartyPinGateProps {
  code: string;
  pending: boolean;
  error: string | null;
  onSubmit: (pin: string) => void;
}

export function WatchPartyPinGate({ code, pending, error, onSubmit }: WatchPartyPinGateProps) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [localError, setLocalError] = useState("");
  const submit = () => {
    if (pin.trim().length < 4) {
      setLocalError(t("watchparty.pinMinLength"));
      return;
    }
    setLocalError("");
    onSubmit(pin.trim());
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
        <label htmlFor="watchparty-pin" className="sr-only">
          {t("watchparty.enterPinForRoom", { code })}
        </label>
        <input
          id="watchparty-pin"
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setLocalError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="••••"
          disabled={pending}
          aria-invalid={!!(localError || error)}
          aria-describedby={localError || error ? "watchparty-pin-error" : undefined}
          className="mt-4 w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-white placeholder:text-white/20 focus:border-netflix-red focus:outline-none disabled:opacity-50"
        />
        {(localError || error) && (
          <p
            id="watchparty-pin-error"
            role="alert"
            className="mt-2 text-center text-sm text-red-400"
          >
            {localError || error || t("watchparty.pinIncorrect")}
          </p>
        )}
        <Button
          onClick={submit}
          disabled={pending}
          className="mt-4 w-full bg-netflix-red hover:bg-netflix-red-hover"
        >
          {pending ? t("watchparty.creating") : t("watchparty.enterRoom")}
        </Button>
      </div>
    </div>
  );
}
