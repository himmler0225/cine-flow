const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(len = 6): string {
  let out = "";

  const arr = new Uint32Array(len);

  if (typeof crypto !== "undefined") crypto.getRandomValues(arr);

  for (let i = 0; i < len; i++) {
    const n = arr[i] || Math.floor(Math.random() * 1e9);

    out += ALPHABET[n % ALPHABET.length];
  }

  return out;
}

export function buildRoomUrl(code: string): string {
  if (typeof window === "undefined") return `/watch-party/${code}`;

  return `${window.location.origin}/watch-party/${code}`;
}

export const ROOM_TTL_HOURS = 6;

export type RoomBroadcast =
  | {
      event: "PLAY";
      payload: {
        currentTime: number;
      };
    }
  | {
      event: "PAUSE";
      payload: {
        currentTime: number;
      };
    }
  | {
      event: "SEEK";
      payload: {
        seekTo: number;
      };
    }
  | {
      event: "REACTION";
      payload: {
        emoji: string;
        user: string;
      };
    };
