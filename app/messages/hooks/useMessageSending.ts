import { useState, useCallback, useRef } from "react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";
import { Message, Conversation } from "../types";

interface UseMessageSendingProps {
  userId: string | null;
  selectedUserId: string | null;
  conversations: Conversation[];
  currentUserProfile: { name: string; profilePicture: string | null } | null;
  encryption: any;
  enableEncryption: boolean;
  receiverPublicKey: string | null;
  onMessageSent: (message: Message) => void;
  onOptimisticMessage: (message: Message) => void;
  onRemoveTempMessage: (tempId: string) => void;
  refreshConversations: () => void;
}

export function useMessageSending({
  userId,
  selectedUserId,
  conversations,
  currentUserProfile,
  encryption,
  enableEncryption,
  receiverPublicKey,
  onMessageSent,
  onOptimisticMessage,
  onRemoveTempMessage,
  refreshConversations,
}: UseMessageSendingProps) {
  const [sending, setSending] = useState(false);
  const publicKeyCacheRef = useRef<Map<string, string>>(new Map());

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !selectedUserId || !userId || sending) return;

    setSending(true);
    const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
    const selectedConv = conversations.find((c: Conversation) => c.user.id === selectedUserId);

    let encryptedContent: string | null = null;
    let encryptionKeyId: string | null = null;

    if (encryption && enableEncryption && receiverPublicKey && encryption.hasKeys) {
      try {
        if (!publicKeyCacheRef.current.has(selectedUserId)) {
          publicKeyCacheRef.current.set(selectedUserId, receiverPublicKey);
        }

        const encrypted = await encryption.encryptForUser(content, receiverPublicKey);
        if (encrypted) {
          encryptedContent = JSON.stringify(encrypted);
          encryptionKeyId = encryption.keyPair?.keyId || null;
        }
      } catch (error) {
        console.error("Error encrypting message:", error);
        toast.error("Gagal mengenkripsi pesan. Mengirim sebagai plain text.");
      }
    }

    const optimisticMessage: Message = {
      id: tempMessageId,
      content: content.trim(),
      encryptedContent: encryptedContent,
      encryptionKeyId: encryptionKeyId,
      senderId: userId,
      receiverId: selectedUserId,
      type: "text",
      mediaUrl: null,
      read: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: userId,
        name: currentUserProfile?.name || "You",
        profilePicture: currentUserProfile?.profilePicture || null,
      },
      receiver: {
        id: selectedUserId,
        name: selectedConv?.user.name || "",
        profilePicture: selectedConv?.user.profilePicture || null,
      },
    };

    onOptimisticMessage(optimisticMessage);

    try {
      const response = await AxiosInstance.post("/direct-messages", {
        receiverId: selectedUserId,
        content: content.trim(),
        encryptedContent: encryptedContent,
        encryptionKeyId: encryptionKeyId,
        type: "text",
      });

      const realMessage = response.data.directMessage;

      if (!realMessage || !realMessage.id) {
        console.error("[SendMessage] Invalid real message from server:", realMessage);
        return;
      }

      onMessageSent(realMessage);
      onRemoveTempMessage(tempMessageId);
      refreshConversations();
    } catch (error: any) {
      console.error("Error sending message:", error);
      onRemoveTempMessage(tempMessageId);
      toast.error(error.response?.data?.error || "Gagal mengirim pesan");
      throw error;
    } finally {
      setSending(false);
    }
  }, [
    userId,
    selectedUserId,
    conversations,
    currentUserProfile,
    encryption,
    enableEncryption,
    receiverPublicKey,
    sending,
    onMessageSent,
    onOptimisticMessage,
    onRemoveTempMessage,
    refreshConversations,
  ]);

  const sendMessageWithMedia = useCallback(async (
    mediaUrl: string,
    mediaType: "image" | "video" | "audio",
    content: string
  ) => {
    if (!selectedUserId || sending || !userId) return;

    const messageContent = content && content.trim()
      ? content.trim()
      : (mediaType === "audio" ? "Voice message" : mediaType === "image" ? "Image" : "Video");

    const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
    const selectedConv = conversations.find((c: Conversation) => c.user.id === selectedUserId);

    const optimisticMessage: Message = {
      id: tempMessageId,
      content: messageContent,
      senderId: userId,
      receiverId: selectedUserId,
      type: mediaType,
      mediaUrl: mediaUrl,
      read: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: userId,
        name: currentUserProfile?.name || "You",
        profilePicture: currentUserProfile?.profilePicture || null,
      },
      receiver: {
        id: selectedUserId,
        name: selectedConv?.user.name || "",
        profilePicture: selectedConv?.user.profilePicture || null,
      },
    };

    onOptimisticMessage(optimisticMessage);

    try {
      const response = await AxiosInstance.post("/direct-messages", {
        receiverId: selectedUserId,
        content: messageContent,
        type: mediaType,
        mediaUrl: mediaUrl,
      });

      const realMessage = response.data.directMessage;
      onMessageSent(realMessage);
      onRemoveTempMessage(tempMessageId);
      refreshConversations();
      toast.success("Media berhasil dikirim");
    } catch (error: any) {
      console.error("Error sending media message:", error);
      onRemoveTempMessage(tempMessageId);
      toast.error(error.response?.data?.error || "Gagal mengirim pesan");
      throw error;
    } finally {
      setSending(false);
    }
  }, [
    userId,
    selectedUserId,
    conversations,
    currentUserProfile,
    sending,
    onMessageSent,
    onOptimisticMessage,
    onRemoveTempMessage,
    refreshConversations,
  ]);

  return {
    sending,
    sendMessage,
    sendMessageWithMedia,
  };
}

