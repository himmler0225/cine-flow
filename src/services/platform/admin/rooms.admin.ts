import { platformFetch, platformMutate, type ApiMutationResult } from "@/lib/platformApi";
import type { AdminRoomRow } from "@/types/admin";
import type { RoomMessage, RoomMemberRow } from "@/types/watchParty";

type AdminRoomMemberRow = RoomMemberRow & {
  joined_at: string;
};

class AdminRoomsApi {
  fetchStats() {
    return platformFetch<{
      active: number;
      members: number;
      msgs: number;
    }>("/api/admin/rooms/stats");
  }
  fetchList(showHistory: boolean) {
    return platformFetch<AdminRoomRow[]>(`/api/admin/rooms?history=${showHistory ? "1" : "0"}`);
  }
  async fetchMemberAndMessageCounts(roomIds: string[]) {
    const memberCount: Record<string, number> = {};

    const msgCount: Record<string, number> = {};

    for (const id of roomIds) {
      memberCount[id] = 0;

      msgCount[id] = 0;
    }

    return { memberCount, msgCount };
  }
  deleteById(roomId: string): Promise<ApiMutationResult> {
    return platformMutate(`/api/admin/rooms/${roomId}`, { method: "DELETE" });
  }
  fetchMembers(roomId: string) {
    return platformFetch<AdminRoomMemberRow[]>(`/api/admin/rooms/${roomId}/members`);
  }
  fetchMessages(roomId: string) {
    return platformFetch<RoomMessage[]>(`/api/admin/rooms/${roomId}/messages`);
  }
}

export const adminRoomsApi = new AdminRoomsApi();
