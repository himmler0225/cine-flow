import { t } from "@/lib/i18n";
import { prettifySlug } from "@/utils/prettifySlug";

export function getMovieListLabel(slug: string): string {
  const key = `movieLists.${slug}`;

  const translated = t(key);

  return translated !== key ? translated : prettifySlug(slug);
}
