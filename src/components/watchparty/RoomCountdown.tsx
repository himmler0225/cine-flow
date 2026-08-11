import { useEffect, useState } from "react";
import { UI_DELAY_MS } from "@/constants/timing";
import { useTranslation } from "react-i18next";

export function RoomCountdown({ expiresAt }: { expiresAt: string }) {
  const { t } = useTranslation();

  const [left, setLeft] = useState(() => diff(expiresAt));

  useEffect(() => {
    const timer = window.setInterval(() => setLeft(diff(expiresAt)), UI_DELAY_MS.countdownTick);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  if (left <= 0)
    return <span className="text-xs text-netflix-red">{t("watchparty.roomExpiredShort")}</span>;

  return (
    <span className="font-mono text-xs text-netflix-muted">
      {t("watchparty.roomRemaining", { time: fmt(left) })}
    </span>
  );
}

function diff(iso: string) {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

function fmt(s: number) {
  const h = Math.floor(s / 3600);

  const m = Math.floor((s % 3600) / 60);

  const sec = s % 60;

  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
