import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiChatApi } from "@/services/platform/aiChat.service";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthStore } from "@/store/authStore";

export function useChatConversations() {
  const user = useAuthStore((s) => s.user);

  const qc = useQueryClient();

  const queryKey = queryKeys.chat.conversations(user?.id ?? "");

  const query = useQuery({
    queryKey,
    queryFn: () => aiChatApi.listConversations(),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (conversationId: string) => aiChatApi.deleteConversation(conversationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  return {
    conversations: query.data?.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    deleteConversation: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
