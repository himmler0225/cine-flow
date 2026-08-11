import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "@/lib/auth/authToken";
import { rejectNormalizedAxiosError } from "@/lib/http/axiosError";
import { MOVIE_API_BASE_URL } from "@/lib/movie/movieApi";
import { MOVIE_API_TIMEOUT_MS } from "@/constants/timing";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
  }
  interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
  }
}

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

movieApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;

    const status = error.response?.status;

    const url = config?.url ?? "";

    const isAuthRefresh = url.includes("/api/auth/refresh") || url.includes("/api/auth/login");

    if (status === 401 && config && !config.skipAuth && !config._retry && !isAuthRefresh) {
      config._retry = true;

      try {
        const { authApi } = await import("@/services/platform/auth.service");

        const session = await authApi.refreshSession();

        if (session?.access_token) {
          config.headers.set("Authorization", `Bearer ${session.access_token}`);

          return movieApiClient.request(config);
        }
      } catch {}
    }

    return rejectNormalizedAxiosError(error);
  },
);
