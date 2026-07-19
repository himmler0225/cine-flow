/** Chuyển slug kebab-case thành tiêu đề đọc được (fallback khi chưa có tên từ API). */
export function prettifySlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
