import type { Wrapped } from "@/services/platform/series.service";

/** Draws a 1080×1350 shareable card (text only, so no cross-origin images taint it). */
export async function renderWrappedCard(
  w: Wrapped,
  labels: { title: string; hours: string; topTitle: string; topGenres: string; persona: string },
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");

  canvas.width = 1080;

  canvas.height = 1350;

  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, 1080, 1350);

  bg.addColorStop(0, "#7f0a10");

  bg.addColorStop(0.55, "#1a0204");

  bg.addColorStop(1, "#0a0a0a");

  ctx.fillStyle = bg;

  ctx.fillRect(0, 0, 1080, 1350);

  await document.fonts?.ready;

  const font = (weight: number, size: number) =>
    `${weight} ${size}px Inter, system-ui, -apple-system, sans-serif`;

  const text = (
    value: string,
    x: number,
    y: number,
    weight: number,
    size: number,
    color = "#fff",
  ) => {
    ctx.font = font(weight, size);

    ctx.fillStyle = color;

    let out = value;

    while (ctx.measureText(out).width > 960 && out.length > 4) out = `${out.slice(0, -2)}…`;

    ctx.fillText(out, x, y);
  };

  text("CINEFLOW", 60, 110, 800, 44, "#ff4d55");

  text(labels.title, 60, 230, 800, 56);

  text(labels.hours, 60, 470, 900, 150);

  text(labels.persona, 60, 560, 600, 44, "#ffb3b6");

  text(labels.topTitle, 60, 720, 700, 40, "#d4d4d4");

  w.top_titles
    .slice(0, 3)
    .forEach((m, i) => text(`${i + 1}. ${m.name}`, 60, 790 + i * 66, 700, 50));

  text(labels.topGenres, 60, 1080, 700, 40, "#d4d4d4");

  text([...w.top_genres, ...w.top_countries].slice(0, 3).join(" · "), 60, 1150, 700, 46);

  text("review-mine.com/wrapped", 60, 1290, 500, 32, "#a3a3a3");

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
