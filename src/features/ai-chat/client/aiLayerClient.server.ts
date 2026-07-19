import axios, { type AxiosInstance } from "axios";
import { serverEnv } from "@/config/env.server";
import { rejectNormalizedAxiosError } from "@/lib/http/axiosError";

/** Default timeout for non-streaming ai-layer JSON calls. */
export const AI_LAYER_TIMEOUT_MS = 30_000;

/**
 * Server-only Axios client for ai-layer.
 * Attaches X-API-Key automatically; stream Proxy keeps fetch for SSE/Web Streams.
 */
export const aiLayerClient: AxiosInstance = axios.create({
  baseURL: serverEnv.AI_LAYER_URL,
  timeout: AI_LAYER_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

aiLayerClient.interceptors.request.use((config) => {
  config.headers.set("X-API-Key", serverEnv.AI_LAYER_KEY);
  return config;
});

aiLayerClient.interceptors.response.use((response) => response, rejectNormalizedAxiosError);
