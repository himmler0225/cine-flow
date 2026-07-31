import { useEffect } from "react";

export function useScrollToTopOnChange(dep: unknown) {
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [dep]);
}
