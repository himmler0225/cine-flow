import { z } from "zod";

export const filterSearchSchema = z.object({
  category: z.string().optional(),
  country: z.string().optional(),
  year: z.string().optional(),
  sort_lang: z.string().optional(),
  sort_field: z.string().optional(),
  sort_type: z.string().optional(),

  page: z.coerce.number().int().min(1).optional(),
});

export type FilterSearch = z.infer<typeof filterSearchSchema>;

/** Drop page=1 from the URL search params. */
export function optionalPage(page: number): number | undefined {
  return page === 1 ? undefined : page;
}
