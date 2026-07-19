import { useEffect } from "react";

/** Cuộn lên đầu trang khi dependency thay đổi (thường dùng khi đổi trang phân trang). */
export function useScrollToTopOnChange(dep: unknown) {
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [dep]);
}
