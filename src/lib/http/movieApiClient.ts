import axios, { type AxiosInstance } from "axios";
import { getAccessToken } from "@/lib/auth/authToken";
import { rejectNormalizedAxiosError } from "@/lib/http/axiosError";
import { MOVIE_API_BASE_URL } from "@/lib/movie/movieApi";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
  }

  interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
  }
}

/** Default timeout for movie-aggregator-api calls (platform + movies). */
export const MOVIE_API_TIMEOUT_MS = 30_000;

/**
 * Shared Axios client for movie-aggregator-api.
 * Interceptors attach browser auth and normalize API error messages.
 */
export const movieApiClient: AxiosInstance = axios.create({
  baseURL: MOVIE_API_BASE_URL,
  timeout: MOVIE_API_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

movieApiClient.interceptors.request.use((config) => {
  const token = config.skipAuth ? null : getAccessToken();
  if (token && !config.headers.has("Authorization")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

movieApiClient.interceptors.response.use((response) => response, rejectNormalizedAxiosError);
