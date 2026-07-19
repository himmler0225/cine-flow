import { platformFetch, platformMutate, type ApiMutationResult } from "@/lib/platformApi";
import type { AdminRoomRow } from "@/types/admin";
import type { RoomMessage, RoomMemberRow } from "@/types/watchParty";

type AdminRoomMember = RoomMemberRow & { id: string; joined_at: string };

export async function fetchAdminRoomStats() {
  return platformFetch<{ active: number; members: number; msgs: number }>("/api/admin/rooms/stats");
}

export async function fetchAdminRoomsList(showHistory: boolean) {
  return platformFetch<AdminRoomRow[]>(`/api/admin/rooms?history=${showHistory ? "1" : "0"}`);
}

export async function fetchRoomMemberAndMessageCounts(roomIds: string[]) {
  const rooms = await fetchAdminRoomsList(true);
  const memberCount: Record<string, number> = {};
  const msgCount: Record<string, number> = {};
  for (const id of roomIds) {
    memberCount[id] = 0;
    msgCount[id] = 0;
  }
  void rooms;
  return { memberCount, msgCount };
}

export async function deleteWatchRoomById(roomId: string): Promise<ApiMutationResult> {
  return platformMutate(`/api/admin/rooms/${roomId}`, { method: "DELETE" });
}

export async function fetchAdminRoomMembers(roomId: string) {
  return platformFetch<AdminRoomMember[]>(`/api/watch-party/rooms/${roomId}/members`, {
    auth: false,
  });
}

export async function fetchAdminRoomMessages(roomId: string) {
  return platformFetch<RoomMessage[]>(`/api/watch-party/rooms/${roomId}/messages`, {
    auth: false,
  });
}
