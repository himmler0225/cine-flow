import {
  COMBINING_MARK_PATTERN,
  LOWERCASE_D_STROKE_PATTERN,
  UPPERCASE_D_STROKE_PATTERN,
} from "@/constants/patterns";

export function removeDiacritics(str: string): string {
  if (!str) return "";

  return str
    .normalize("NFD")
    .replace(COMBINING_MARK_PATTERN, "")
    .replace(LOWERCASE_D_STROKE_PATTERN, "d")
    .replace(UPPERCASE_D_STROKE_PATTERN, "D");
}
