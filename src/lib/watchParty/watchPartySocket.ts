import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/auth/authToken";
import { MOVIE_API_BASE_URL } from "@/lib/movie/movieApi";

export type WatchPartyBroadcastEvent =
  | "PLAY"
  | "PAUSE"
  | "SEEK"
  | "REACTION"
  | "COUNTDOWN"
  | "STATE";

export interface WatchPartyPresence {
  userId: string;
  username: string;
  avatar_url: string | null;
  isHost: boolean;
  joinedAt: number;
}

export function createWatchPartySocket(token?: string | null): Socket {
  return io(`${MOVIE_API_BASE_URL}/watch-party`, {
    auth: { token: token ?? getAccessToken() },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
  });
}
