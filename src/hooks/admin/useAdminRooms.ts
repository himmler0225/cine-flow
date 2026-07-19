import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  fetchAdminRoomMembers,
  fetchAdminRoomMessages,
  fetchAdminRoomStats,
  fetchAdminRoomsList,
  fetchRoomMemberAndMessageCounts,
} from "@/services/platform/admin/rooms.admin";

export function useAdminRooms(showHistory: boolean) {
  const stats = useQuery({
    queryKey: queryKeys.admin.roomStats(),
    queryFn: fetchAdminRoomStats,
  });

  const rooms = useQuery({
    queryKey: queryKeys.admin.rooms(showHistory),
    queryFn: () => fetchAdminRoomsList(showHistory),
  });

  const roomIds = rooms.data?.map((room) => room.id) ?? [];
  const counts = useQuery({
    queryKey: queryKeys.admin.roomCounts(roomIds.join(",")),
    enabled: roomIds.length > 0,
    queryFn: () => fetchRoomMemberAndMessageCounts(roomIds),
  });

  return { stats, rooms, counts };
}

export function useAdminRoomDetail(roomId: string, tab: "members" | "messages") {
  const members = useQuery({
    queryKey: queryKeys.admin.roomMembers(roomId),
    enabled: !!roomId && tab === "members",
    queryFn: () => fetchAdminRoomMembers(roomId),
  });

  const messages = useQuery({
    queryKey: queryKeys.admin.roomMessages(roomId),
    enabled: !!roomId && tab === "messages",
    queryFn: () => fetchAdminRoomMessages(roomId),
  });

  return { members, messages };
}
