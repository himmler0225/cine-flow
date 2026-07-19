import { platformFetch, type ApiErrorPayload } from "@/lib/platformApi";
import { t } from "@/lib/i18n";
import type { RoomMessage, WatchRoom, RoomMemberRow } from "@/types/watchParty";
import { WATCH_ROOM_BASE_COLUMNS, WATCH_ROOM_COLUMNS } from "@/types/watchParty";

export { WATCH_ROOM_COLUMNS, WATCH_ROOM_BASE_COLUMNS };

export interface CreateRoomInput {
  code: string;
  hostId: string;
  movieSlug: string;
  movieName: string;
  thumbUrl?: string | null;
  episodeName: string;
  serverIndex: number;
  expiresHours?: number;
  isPrivate?: boolean;
  pin?: string | null;
}

export interface RoomMemberInput {
  roomId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
}

export interface RoomPlaybackState {
  playbackTime: number;
  isPlaying: boolean;
  episodeName: string;
  serverIndex: number;
}

export async function createWatchRoom(input: CreateRoomInput) {
  return platformFetch<{ data: { id: string }; error: ApiErrorPayload | null }>(
    "/api/watch-party/rooms",
    {
      method: "POST",
      body: JSON.stringify({
        code: input.code,
        movie_slug: input.movieSlug,
        movie_name: input.movieName,
        thumb_url: input.thumbUrl,
        episode_name: input.episodeName,
        server_index: input.serverIndex,
        expires_hours: input.expiresHours,
        is_private: input.isPrivate,
        pin: input.pin,
      }),
    },
  );
}

export async function addRoomMember(input: RoomMemberInput) {
  return { error: null };
}

export async function insertRoomMessage(
  roomId: string,
  userId: string,
  username: string,
  content: string,
  type: RoomMessage["type"] = "message",
  avatarUrl: string | null = null,
) {
  return platformFetch("/api/watch-party/rooms/" + roomId + "/messages", {
    method: "POST",
    body: JSON.stringify({ username, content, type, avatar_url: avatarUrl }),
  });
}

export async function fetchRoomByCode(code: string) {
  return platformFetch<{
    data: { code: string; expires_at: string } | null;
    error: ApiErrorPayload | null;
  }>(`/api/watch-party/rooms/${encodeURIComponent(code)}/preview`, { auth: false });
}

export async function fetchWatchRoomFull(code: string): Promise<WatchRoom | null> {
  return platformFetch<WatchRoom | null>(`/api/watch-party/rooms/${encodeURIComponent(code)}`, {
    auth: false,
  });
}

export async function fetchRoomMembers(roomId: string): Promise<RoomMemberRow[]> {
  return platformFetch<RoomMemberRow[]>(`/api/watch-party/rooms/${roomId}/members`, {
    auth: false,
  });
}

export async function isRoomMember(roomId: string, userId: string): Promise<boolean> {
  const members = await fetchRoomMembers(roomId);
  return members.some((m) => m.user_id === userId);
}

export async function joinRoomAsGuest(
  roomId: string,
  userId: string,
  username: string,
  avatarUrl: string | null,
  hostId: string,
) {
  return platformFetch<boolean>(`/api/watch-party/rooms/${roomId}/join`, {
    method: "POST",
    body: JSON.stringify({
      username,
      avatar_url: avatarUrl,
      host_id: hostId,
      joined_message: t("watchparty.joinedRoom", { username }),
    }),
  });
}

export async function updateRoomPlayback(roomId: string, state: RoomPlaybackState) {
  return platformFetch(`/api/watch-party/rooms/${roomId}/playback`, {
    method: "PATCH",
    body: JSON.stringify({
      playback_time: state.playbackTime,
      is_playing: state.isPlaying,
      episode_name: state.episodeName,
      server_index: state.serverIndex,
    }),
  });
}

export async function removeRoomMember(roomId: string, _userId: string) {
  return platformFetch(`/api/watch-party/rooms/${roomId}/members/me`, { method: "DELETE" });
}

export async function deleteWatchRoom(roomId: string) {
  return platformFetch<{ error: ApiErrorPayload | null }>(`/api/watch-party/rooms/${roomId}`, {
    method: "DELETE",
  });
}

export async function fetchRoomMessages(roomId: string, limit = 200): Promise<RoomMessage[]> {
  return platformFetch<RoomMessage[]>(`/api/watch-party/rooms/${roomId}/messages?limit=${limit}`, {
    auth: false,
  });
}

/** @deprecated Realtime moved to polling — kept for import compatibility */
export const watchPartyClient = null;
