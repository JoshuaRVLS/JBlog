import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AxiosInstance from "@/utils/api";

interface UseConversationPrefetchProps {
  selectedUserId: string | null;
  userId: string | null;
}

export function useConversationPrefetch({
  selectedUserId,
  userId,
}: UseConversationPrefetchProps) {
  const queryClient = useQueryClient();
  const prefetchTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleConversationHover = (hoverUserId: string) => {
    if (!userId) return;

    const existingTimeout = prefetchTimeoutRef.current.get(hoverUserId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      if (selectedUserId !== hoverUserId) {
        queryClient.prefetchQuery({
          queryKey: ["messages", hoverUserId, userId],
          queryFn: async () => {
            const response = await AxiosInstance.get(`/direct-messages/${hoverUserId}`, {
              params: { page: 1, limit: 30 },
            });
            return {
              messages: response.data.messages || [],
              pagination: response.data.pagination,
            };
          },
        });
      }
      prefetchTimeoutRef.current.delete(hoverUserId);
    }, 300);

    prefetchTimeoutRef.current.set(hoverUserId, timeout);
  };

  const handleConversationLeave = (hoverUserId: string) => {
    const timeout = prefetchTimeoutRef.current.get(hoverUserId);
    if (timeout) {
      clearTimeout(timeout);
      prefetchTimeoutRef.current.delete(hoverUserId);
    }
  };

  return {
    handleConversationHover,
    handleConversationLeave,
  };
}

