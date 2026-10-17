export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/**
 * Share a watch-party invite. Phones get the system share sheet (Web Share API), which
 * lists Zalo, Messenger, … when installed — Zalo has no public web share endpoint without an
 * Official Account. Elsewhere the invite text is copied to the clipboard.
 */
export async function shareRoomInvite(input: {
  title: string;
  text: string;
  url: string;
}): Promise<ShareResult> {
  if (typeof navigator === "undefined") return "failed";

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: input.title, text: input.text, url: input.url });

      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }

  try {
    await navigator.clipboard.writeText(
      input.text.includes(input.url) ? input.text : `${input.text} ${input.url}`,
    );

    return "copied";
  } catch {
    return "failed";
  }
}

/** "2026-10-17T20:30" for <input type="datetime-local">, in the viewer's timezone. */
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatRoomStart(iso: string, locale = "vi-VN"): string {
  return new Date(iso).toLocaleString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
