import { QueryClient, dehydrate, hydrate, type DehydratedState } from "@tanstack/react-query";
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
    // Ship the queries warmed by route loaders (ensureQueryData) to the client so the first
    // client render matches the SSR HTML. Without this the client cache started empty, React
    // threw a hydration mismatch (#418) and re-rendered the whole page from scratch.
    // JSON string: query data is plain API JSON, and a string satisfies the router's
    // serializable-type constraint that DehydratedState's `unknown` fields do not.
    dehydrate: () => ({ queryClientState: JSON.stringify(dehydrate(queryClient)) }),
    hydrate: (dehydrated: { queryClientState: string }) => {
      hydrate(queryClient, JSON.parse(dehydrated.queryClientState) as DehydratedState);
    },
  });

  return router;
};
