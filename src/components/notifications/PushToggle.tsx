import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { disablePush, enablePush, getPushState, type PushState } from "@/lib/pushNotifications";
import { pushApi } from "@/services/platform/push.service";

/** "Notify me about new episodes" switch shown in the notification menu. */
export function PushToggle() {
  const { t } = useTranslation();

  const [state, setState] = useState<PushState | null>(null);

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    void getPushState().then((s) => alive && setState(s));

    return () => {
      alive = false;
    };
  }, []);

  if (state === null || state === "unsupported" || state === "disabled") return null;

  const on = state === "on";

  const toggle = async () => {
    setBusy(true);

    try {
      const next = on ? await disablePush() : await enablePush();

      setState(next);

      if (next === "on") toast.success(t("notifications.pushEnabled"));
      else if (next === "denied") toast.error(t("notifications.pushDenied"));
    } catch {
      toast.error(t("notifications.pushFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-white/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <BellRing className="h-4 w-4 shrink-0 text-netflix-red" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white">{t("notifications.pushTitle")}</p>
          <p className="text-xs text-netflix-muted">
            {state === "needs-install"
              ? t("notifications.pushNeedsInstall")
              : state === "denied"
                ? t("notifications.pushBlockedHint")
                : t("notifications.pushHint")}
          </p>
        </div>
        {(state === "on" || state === "off") && (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={t("notifications.pushTitle")}
            disabled={busy}
            onClick={() => void toggle()}
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50",
              on ? "bg-netflix-red" : "bg-white/25",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                on ? "translate-x-4" : "translate-x-0.5",
              )}
            />
          </button>
        )}
      </div>
      {on && (
        <button
          type="button"
          onClick={() =>
            void pushApi
              .test()
              .then(() => toast.message(t("notifications.pushTestSent")))
              .catch(() => toast.error(t("notifications.pushFailed")))
          }
          className="mt-2 text-xs text-netflix-muted underline-offset-2 hover:text-white hover:underline"
        >
          {t("notifications.pushTest")}
        </button>
      )}
    </div>
  );
}
