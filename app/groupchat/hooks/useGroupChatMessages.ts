import { useState, useEffect, useRef, useCallback } from "react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";
import { Message, GroupChat } from "../types";

interface UseGroupChatMessagesProps {
  selectedGroup: GroupChat | null;
  userId: string | null;
}

export function useGroupChatMessages({
  selectedGroup,
  userId,
}: UseGroupChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesCacheRef = useRef<Map<string, Message[]>>(new Map());
  const prefetchTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fetchMessages = useCallback(async (silent = false) => {
    if (!selectedGroup) return;

    try {
      if (!silent) setLoadingMessages(true);
      const response = await AxiosInstance.get(`/groupchat/${selectedGroup.id}/messages`, {
        params: { limit: 100 },
      });
      const fetchedMessages = response.data.messages || [];

      messagesCacheRef.current.set(selectedGroup.id, fetchedMessages);

      if (selectedGroup) {
        setMessages(fetchedMessages);
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      if (!silent && error.response?.status !== 403) {
        toast.error(error.response?.data?.msg || "Gagal mengambil messages");
      }
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [selectedGroup]);

  const handleGroupHover = useCallback((groupId: string) => {
    const existingTimeout = prefetchTimeoutRef.current.get(groupId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(async () => {
      if (!messagesCacheRef.current.has(groupId) && selectedGroup?.id !== groupId) {
        try {
          const response = await AxiosInstance.get(`/groupchat/${groupId}/messages`, {
            params: { limit: 100 },
          });
          const fetchedMessages = response.data.messages || [];
          messagesCacheRef.current.set(groupId, fetchedMessages);
        } catch (error) {
          console.error("Error prefetching messages:", error);
        }
      }
      prefetchTimeoutRef.current.delete(groupId);
    }, 300);

    prefetchTimeoutRef.current.set(groupId, timeout);
  }, [selectedGroup]);

  const handleGroupLeave = useCallback((groupId: string) => {
    const timeout = prefetchTimeoutRef.current.get(groupId);
    if (timeout) {
      clearTimeout(timeout);
      prefetchTimeoutRef.current.delete(groupId);
    }
  }, []);

  const markMessagesAsRead = useCallback(async () => {
    if (!selectedGroup || !userId || !messages.length) return;

    const unreadMessages = messages.filter((msg) => {
      if (msg.user?.id === userId) return false;
      return !msg.reads?.some((read) => read.userId === userId);
    });

    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map((msg) =>
          AxiosInstance.put(`/groupchat/messages/${msg.id}/read`).catch(() => {})
        )
      );
    }
  }, [selectedGroup, userId, messages]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const messageExists = prev.some((msg) => msg.id === message.id);
      if (messageExists) {
        return prev;
      }

      const filtered = prev.filter((msg) => {
        if (msg.id.startsWith("temp-") && msg.user.id === message.user.id) {
          if (message.type === "text" && msg.type === "text") {
            return msg.content !== message.content;
          }
          if (message.type !== "text" && msg.type !== "text" && message.mediaUrl) {
            return msg.mediaUrl !== message.mediaUrl;
          }
          return true;
        }
        return true;
      });

      const updated = [...filtered, message];

      if (selectedGroup) {
        messagesCacheRef.current.set(selectedGroup.id, updated);
      }

      return updated;
    });
  }, [selectedGroup]);

  const updateMessageRead = useCallback((data: { messageId: string; userId: string; readAt: string }) => {
    setMessages((prev) => {
      const updated = prev.map((msg) => {
        if (msg.id === data.messageId) {
          const existingRead = msg.reads?.find((r) => r.userId === data.userId);
          if (!existingRead) {
            return {
              ...msg,
              reads: [
                ...(msg.reads || []),
                {
                  id: `temp-${data.userId}`,
                  userId: data.userId,
                  readAt: data.readAt,
                  user: {
                    id: data.userId,
                    name: "",
                    profilePicture: null,
                  },
                },
              ],
            };
          }
        }
        return msg;
      });
      if (selectedGroup) {
        messagesCacheRef.current.set(selectedGroup.id, updated);
      }
      return updated;
    });
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedGroup) {
      const cached = messagesCacheRef.current.get(selectedGroup.id);
      if (cached) {
        setMessages(cached);
        setLoadingMessages(false);
      } else {
        setLoadingMessages(true);
      }

      fetchMessages();

      const readTimeout = setTimeout(() => {
        markMessagesAsRead();
      }, 1000);

      return () => clearTimeout(readTimeout);
    } else {
      setMessages([]);
    }
  }, [selectedGroup, fetchMessages, markMessagesAsRead]);

  return {
    messages,
    loadingMessages,
    addMessage,
    updateMessageRead,
    handleGroupHover,
    handleGroupLeave,
    messagesCacheRef,
  };
}

