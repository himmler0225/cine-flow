import { STORAGE_KEYS } from "@/constants/storage";

export function isPinVerified(code: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(`${STORAGE_KEYS.watchPartyPinPrefix}${code.toUpperCase()}`) === "1";
}

export function markPinVerified(code: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${STORAGE_KEYS.watchPartyPinPrefix}${code.toUpperCase()}`, "1");
}

export function verifyRoomPin(roomPin: string | null | undefined, input: string): boolean {
  if (!roomPin) return false;
  return roomPin === input.trim();
}
