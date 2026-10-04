/**
 * JSON for an inline <script type="application/ld+json">. Escapes "<" so values that come
 * from upstream APIs (movie names, descriptions) cannot close the tag with "</script>".
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
