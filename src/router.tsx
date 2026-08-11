import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { CACHE_TTL, QUERY_RETRY } from "@/constants/timing";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: CACHE_TTL.fiveMinutes,
        gcTime: CACHE_TTL.tenMinutes,
        retry: QUERY_RETRY.attempts,
        retryDelay: (attempt) =>
          Math.min(QUERY_RETRY.baseDelayMs * 2 ** attempt, QUERY_RETRY.maxDelayMs),
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30000,
  });

  return router;
};
