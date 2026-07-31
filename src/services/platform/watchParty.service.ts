import { platformFetch, type ApiErrorPayload } from "@/lib/platformApi";
import { t } from "@/lib/i18n";
import type { RoomMessage, WatchRoom, RoomMemberRow } from "@/types/watchParty";

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

export interface RoomPlaybackState {
  playbackTime: number;
  isPlaying: boolean;
  episodeName: string;
  serverIndex: number;
}

class WatchPartyApi {
  createRoom(input: CreateRoomInput) {
    return platformFetch<{
      data: {
        id: string;
      };
      error: ApiErrorPayload | null;
    }>("/api/watch-party/rooms", {
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
    });
  }
  insertMessage(
    roomId: string,
    username: string,
    content: string,
    type: RoomMessage["type"] = "message",
    avatarUrl: string | null = null,
  ) {
    return platformFetch(`/api/watch-party/rooms/${roomId}/messages`, {
      method: "POST",
      body: JSON.stringify({ username, content, type, avatar_url: avatarUrl }),
    });
  }
  fetchRoomPreview(code: string) {
    return platformFetch<{
      data: {
        code: string;
        expires_at: string;
      } | null;
      error: ApiErrorPayload | null;
    }>(`/api/watch-party/rooms/${encodeURIComponent(code)}/preview`, { auth: false });
  }
  fetchRoomFull(code: string): Promise<WatchRoom | null> {
    return platformFetch<WatchRoom | null>(`/api/watch-party/rooms/${encodeURIComponent(code)}`, {
      auth: false,
    });
  }
  fetchMembers(roomId: string): Promise<RoomMemberRow[]> {
    return platformFetch<RoomMemberRow[]>(`/api/watch-party/rooms/${roomId}/members`);
  }
  join(roomId: string, username: string, avatarUrl: string | null, pin?: string) {
    return platformFetch<boolean>(`/api/watch-party/rooms/${roomId}/join`, {
      method: "POST",
      body: JSON.stringify({
        username,
        avatar_url: avatarUrl,
        pin,
        joined_message: t("watchparty.joinedRoom", { username }),
      }),
    });
  }
  updatePlayback(roomId: string, state: RoomPlaybackState) {
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
  removeMember(roomId: string) {
    return platformFetch(`/api/watch-party/rooms/${roomId}/members/me`, { method: "DELETE" });
  }
  deleteRoom(roomId: string) {
    return platformFetch<{
      error: ApiErrorPayload | null;
    }>(`/api/watch-party/rooms/${roomId}`, {
      method: "DELETE",
    });
  }
  fetchMessages(roomId: string, limit = 200): Promise<RoomMessage[]> {
    return platformFetch<RoomMessage[]>(`/api/watch-party/rooms/${roomId}/messages?limit=${limit}`);
  }
}

export const watchPartyApi = new WatchPartyApi();
