import { useEffect, useRef } from "react";

/**
 * Keeps the latest value in a ref so long-lived listeners can call the current callback
 * without re-subscribing whenever the parent passes a new function identity.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
