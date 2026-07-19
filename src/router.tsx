import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { CACHE_TTL, QUERY_RETRY } from "@/constants/timing";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Cache hợp lý để giảm gọi API lặp khi điều hướng qua lại
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
    // Prefetch khi hover/focus vào Link để chuyển trang mượt
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
