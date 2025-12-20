import { useEffect } from "react";
import type { Message } from "../types";

export function useSocketMessages(
  socket: any,
  userId: string | null,
  selectedUserId: string | null,
  encryption: any,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  markAsRead: (userId: string) => void,
  refreshConversationsThrottled: () => void,
) {
  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewDirectMessage = async (message: Message) => {
      if (
        selectedUserId &&
        ((message.senderId === selectedUserId && message.receiverId === userId) ||
          (message.senderId === userId && message.receiverId === selectedUserId))
      ) {
        let decryptedMessage = message;
        if (
          encryption &&
          message.encryptedContent &&
          message.senderId !== userId &&
          encryption.hasKeys
        ) {
          try {
            const senderPublicKey = await encryption.getUserPublicKey(
              message.senderId
            );
            if (senderPublicKey) {
              const encrypted = JSON.parse(message.encryptedContent);
              const decrypted = await encryption.decryptFromUser(
                encrypted,
                senderPublicKey
              );
              if (decrypted) {
                decryptedMessage = { ...message, content: decrypted };
              }
            }
          } catch (error) {
            console.error("Error decrypting incoming message:", error);
          }
        }

        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === decryptedMessage.id);
          if (!exists) {
            return [...prev, decryptedMessage];
          }
          return prev;
        });

        if (message.senderId === selectedUserId) {
          markAsRead(selectedUserId);
        }
      }

      refreshConversationsThrottled();
    };

    socket.on("newDirectMessage", handleNewDirectMessage);

    return () => {
      socket.off("newDirectMessage", handleNewDirectMessage);
    };
  }, [socket, userId, selectedUserId, encryption, setMessages, markAsRead, refreshConversationsThrottled]);
}

