const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

export function decodeHtmlEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);

      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }

    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/**
 * Movie descriptions are HTML from third-party APIs. Keep only their text, split into
 * paragraphs, so they render as React text (escaped) instead of injected markup.
 */
export function htmlToParagraphs(html?: string | null): string[] {
  if (!html) return [];

  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split(/\n+/)
    .map((p) => decodeHtmlEntities(p).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
