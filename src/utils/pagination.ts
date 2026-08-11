export function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function getNextPage(
  pagination?: {
    currentPage: number;
    totalPages: number;
  } | null,
): number | undefined {
  if (!pagination) return undefined;

  return pagination.currentPage < pagination.totalPages ? pagination.currentPage + 1 : undefined;
}
