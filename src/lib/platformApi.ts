import { AxiosError } from "axios";
import { getAxiosErrorMessage } from "@/lib/http/axiosError";
import { movieApiClient } from "@/lib/http/movieApiClient";

export class PlatformApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PlatformApiError";
  }
}

export type ApiErrorPayload = {
  message: string;
  code?: string;
};

export type ApiMutationResult<T = unknown> = {
  data?: T;
  error: ApiErrorPayload | null;
};

type PlatformFetchOptions = RequestInit & { auth?: boolean };

/**
 * Authenticated JSON client for movie-aggregator platform routes (`/api/...`).
 * Preserves the previous fetch-based contract (method/body/auth/204/empty).
 */
export async function platformFetch<T>(path: string, options?: PlatformFetchOptions): Promise<T> {
  const headers: Record<string, string> = {};
  if (options?.headers) {
    const incoming = new Headers(options.headers);
    incoming.forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (options?.body && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await movieApiClient.request<T>({
      url: path,
      method: (options?.method as string | undefined) ?? "GET",
      data: options?.body,
      headers,
      signal: options?.signal ?? undefined,
      skipAuth: options?.auth === false,
    });

    if (response.status === 204) return undefined as T;
    if (response.data === "" || response.data === null || response.data === undefined) {
      return undefined as T;
    }
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw new PlatformApiError(
        getAxiosErrorMessage(error, error.response.statusText || "Request failed"),
        error.response.status,
      );
    }
    throw error;
  }
}

/**
 * Mutation helper for UI that still expects `{ error }` instead of thrown `PlatformApiError`.
 */
export async function platformMutate(
  path: string,
  options?: PlatformFetchOptions,
): Promise<ApiMutationResult> {
  try {
    const data = await platformFetch<unknown>(path, options);
    if (data && typeof data === "object" && "error" in data) {
      return data as ApiMutationResult;
    }
    return { data: data as never, error: null };
  } catch (error) {
    if (error instanceof PlatformApiError) {
      return { error: { message: error.message } };
    }
    return {
      error: {
        message: error instanceof Error ? error.message : "Request failed",
      },
    };
  }
}
