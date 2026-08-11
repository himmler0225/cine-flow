import { readStorageKey, writeStorageKey } from "@/constants/storage";

let memoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  memoryAccessToken = token;

  writeStorageKey("accessToken", null);
}

export function getRefreshToken(): string | null {
  return readStorageKey("refreshToken");
}

export function setRefreshToken(token: string | null): void {
  writeStorageKey("refreshToken", token);
}

export function clearAuthTokens(): void {
  memoryAccessToken = null;

  writeStorageKey("accessToken", null);

  writeStorageKey("refreshToken", null);
}

export function applySessionTokens(session: {
  access_token: string;
  refresh_token?: string;
}): void {
  setAccessToken(session.access_token);

  if (session.refresh_token) {
    setRefreshToken(session.refresh_token);
  }
}
