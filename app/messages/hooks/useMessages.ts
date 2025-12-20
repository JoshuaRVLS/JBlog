import { useState, useRef, useEffect, useCallback } from "react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";
import type { Message, Conversation } from "../types";

export function useMessages(
  userId: string | null,
  selectedUserId: string | null,
  encryption: any,
  receiverPublicKey: string | null,
  enableEncryption: boolean,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastConversationsFetchRef = useRef<number>(0);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get("/direct-messages");
      setConversations(response.data.conversations || []);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast.error(error.response?.data?.error || "Gagal mengambil percakapan");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshConversationsThrottled = useCallback(() => {
    const now = Date.now();
    if (now - lastConversationsFetchRef.current < 1000) {
      return;
    }
    lastConversationsFetchRef.current = now;
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = async (otherUserId: string) => {
    try {
      const response = await AxiosInstance.get(`/direct-messages/${otherUserId}`);
      const fetchedMessages = response.data.messages || [];

      if (encryption && encryption.hasKeys) {
        const decryptedMessages = await Promise.all(
          fetchedMessages.map(async (msg: Message) => {
            if (msg.encryptedContent && msg.senderId !== userId) {
              try {
                const senderPublicKey = await encryption.getUserPublicKey(msg.senderId);
                if (senderPublicKey) {
                  const encrypted = JSON.parse(msg.encryptedContent);
                  const decrypted = await encryption.decryptFromUser(
                    encrypted,
                    senderPublicKey
                  );
                  if (decrypted) {
                    return { ...msg, content: decrypted, isDecrypted: true };
                  }
                }
              } catch (error) {
                console.error("Error decrypting message:", error);
              }
            }
            return msg;
          })
        );
        setMessages(decryptedMessages);
      } else {
        setMessages(fetchedMessages);
      }

      markAsRead(otherUserId);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast.error(error.response?.data?.error || "Gagal mengambil pesan");
    }
  };

  const markAsRead = async (otherUserId: string) => {
    try {
      await AxiosInstance.put(`/direct-messages/${otherUserId}/read`);
      refreshConversationsThrottled();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return {
    messages,
    setMessages,
    conversations,
    setConversations,
    loading,
    messagesEndRef,
    fetchConversations,
    fetchMessages,
    refreshConversationsThrottled,
  };
}

