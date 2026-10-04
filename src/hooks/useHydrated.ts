import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * false on the server and while this component hydrates from SSR HTML; true afterwards and
 * for client-only renders. Gate localStorage-backed data (persisted stores, the persisted
 * query cache) with it: route chunks hydrate lazily, after that data has loaded, so reading
 * it during hydration rendered different HTML than the server did (React #418) and React
 * threw the page away and re-rendered it from scratch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
