import { HTML_NBSP_PATTERN, HTML_TAG_PATTERN, WHITESPACE_PATTERN } from "@/constants/patterns";

export function stripHtml(s?: string, maxLen = 280): string {
  return (s ?? "")
    .replace(HTML_TAG_PATTERN, " ")
    .replace(HTML_NBSP_PATTERN, " ")
    .replace(WHITESPACE_PATTERN, " ")
    .trim()
    .slice(0, maxLen);
}
