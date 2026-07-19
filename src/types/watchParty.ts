export interface WatchRoom {
  id: string;
  code: string;
  host_id: string;
  movie_slug: string;
  movie_name: string | null;
  thumb_url: string | null;
  episode_name: string | null;
  server_index: number;
  playback_time: number;
  is_playing: boolean;
  created_at: string;
  expires_at: string;
  is_private?: boolean;
  pin?: string | null;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  content: string;
  type: "message" | "system" | "reaction";
  created_at: string;
}

export interface PresenceUser {
  userId: string;
  username: string;
  avatar_url: string | null;
  isHost: boolean;
  joinedAt: number;
}

export interface RoomMemberRow {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  joined_at?: string;
}

export const WATCH_ROOM_BASE_COLUMNS =
  "id, code, host_id, movie_slug, movie_name, thumb_url, episode_name, server_index, playback_time, is_playing, created_at, expires_at";

export const WATCH_ROOM_COLUMNS = `${WATCH_ROOM_BASE_COLUMNS}, is_private, pin`;
