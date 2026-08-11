export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";

  const total = Math.floor(sec);

  const h = Math.floor(total / 3600);

  const m = Math.floor((total % 3600) / 60);

  const s = total % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return `${m}:${s.toString().padStart(2, "0")}`;
}
