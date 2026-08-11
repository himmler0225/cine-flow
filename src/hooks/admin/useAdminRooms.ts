import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { adminRoomsApi } from "@/services/platform/admin/rooms.admin";

export function useAdminRooms(showHistory: boolean) {
  const stats = useQuery({
    queryKey: queryKeys.admin.roomStats(),
    queryFn: () => adminRoomsApi.fetchStats(),
  });

  const rooms = useQuery({
    queryKey: queryKeys.admin.rooms(showHistory),
    queryFn: () => adminRoomsApi.fetchList(showHistory),
  });

  const roomIds = rooms.data?.map((room) => room.id) ?? [];

  const counts = useQuery({
    queryKey: queryKeys.admin.roomCounts(roomIds.join(",")),
    enabled: roomIds.length > 0,
    queryFn: () => adminRoomsApi.fetchMemberAndMessageCounts(roomIds),
  });

  return { stats, rooms, counts };
}

export function useAdminRoomDetail(roomId: string, tab: "members" | "messages") {
  const members = useQuery({
    queryKey: queryKeys.admin.roomMembers(roomId),
    enabled: !!roomId && tab === "members",
    queryFn: () => adminRoomsApi.fetchMembers(roomId),
  });

  const messages = useQuery({
    queryKey: queryKeys.admin.roomMessages(roomId),
    enabled: !!roomId && tab === "messages",
    queryFn: () => adminRoomsApi.fetchMessages(roomId),
  });

  return { members, messages };
}
