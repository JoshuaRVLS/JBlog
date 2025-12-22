import { useRef, useCallback } from "react";
import AxiosInstance from "@/utils/api";

interface UseMarkAsReadProps {
  userId: string | null;
  refreshConversations: () => void;
}

export function useMarkAsRead({
  userId,
  refreshConversations,
}: UseMarkAsReadProps) {
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMarkAsReadRef = useRef<Map<string, number>>(new Map());

  const markAsRead = useCallback(async (otherUserId: string) => {
    if (!otherUserId || !userId) return;

    const now = Date.now();
    const lastMark = lastMarkAsReadRef.current.get(otherUserId) || 0;
    if (now - lastMark < 1000) {
      return;
    }
    lastMarkAsReadRef.current.set(otherUserId, now);

    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current);
    }

    markAsReadTimeoutRef.current = setTimeout(async () => {
      try {
        await AxiosInstance.put(`/direct-messages/${otherUserId}/read`);
        console.log(`[Read Receipt] Marked messages as read from ${otherUserId}`);
        refreshConversations();
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }, 500);
  }, [userId, refreshConversations]);

  return {
    markAsRead,
  };
}

