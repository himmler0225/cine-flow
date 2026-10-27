import { readStorageKey, writeStorageKey } from "@/constants/storage";

/**
 * The access JWT lives in memory only. The refresh token is an httpOnly cookie set by
 * the API: page scripts never see it and it survives closing the browser.
 */
let memoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  memoryAccessToken = token;
}

/**
 * Refresh token left in localStorage by older versions. Sent once to the API, which
 * swaps it for the cookie; removed as soon as that succeeds or is refused.
 */
export function getLegacyRefreshToken(): string | null {
  return readStorageKey("refreshToken");
}

export function clearLegacyAuthStorage(): void {
  writeStorageKey("refreshToken", null);

  writeStorageKey("accessToken", null);
}

export function clearAuthTokens(): void {
  memoryAccessToken = null;

  clearLegacyAuthStorage();
}

export function applySessionTokens(session: { access_token: string }): void {
  setAccessToken(session.access_token);
}
