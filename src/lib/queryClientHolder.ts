import type { QueryClient } from "@tanstack/react-query";

let appQueryClient: QueryClient | null = null;

export function setAppQueryClient(client: QueryClient) {
  appQueryClient = client;
}

export function getAppQueryClient(): QueryClient | null {
  return appQueryClient;
}
