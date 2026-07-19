import { AxiosError } from "axios";

/** Extracts the backend's error message while preserving the original AxiosError. */
export function getAxiosErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || error.message || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

/** Shared response-error interceptor for all Axios clients. */
export function rejectNormalizedAxiosError(error: unknown): Promise<never> {
  if (error instanceof AxiosError) {
    error.message = getAxiosErrorMessage(error, error.message);
  }
  return Promise.reject(error);
}
