import { useEffect, useRef } from "react";
import type { Message } from "../types";

interface UseSocketMessagesProps {
  socket: any;
  userId: string | null;
  selectedUserId: string | null;
  encryption: any;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  markAsRead: (userId: string) => void;
  refreshConversationsThrottled: () => void;
  messagesCacheRef: React.MutableRefObject<Map<string, Message[]>>;
  publicKeyCacheRef: React.MutableRefObject<Map<string, string>>;
  shouldAutoScrollRef: React.MutableRefObject<boolean>;
}

export function useSocketMessages({
  socket,
  userId,
  selectedUserId,
  encryption,
  setMessages,
  markAsRead,
  refreshConversationsThrottled,
  messagesCacheRef,
  publicKeyCacheRef,
  shouldAutoScrollRef,
}: UseSocketMessagesProps) {
  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewDirectMessage = async (message: Message) => {
      if (
        !selectedUserId ||
        !((message.senderId === selectedUserId && message.receiverId === userId) ||
          (message.senderId === userId && message.receiverId === selectedUserId))
      ) {
        refreshConversationsThrottled();
        return;
      }

      // Handle own message (optimistic update replacement)
      if (message.senderId === userId && message.receiverId === selectedUserId) {
        setMessages((prev) => {
          const hasTempMessage = prev.some((msg) =>
            msg.id.startsWith("temp-") &&
            msg.senderId === userId &&
            msg.receiverId === selectedUserId
          );

          if (hasTempMessage) {
            const updated = prev.map((msg) => {
              if (msg.id.startsWith("temp-") && msg.senderId === userId && msg.receiverId === selectedUserId) {
                return message;
              }
              return msg;
            });
            if (selectedUserId) {
              messagesCacheRef.current.set(selectedUserId, updated);
            }
            return updated;
          }

          const updated = [...prev, message];
          if (selectedUserId) {
            messagesCacheRef.current.set(selectedUserId, updated);
          }
          return updated;
        });

        shouldAutoScrollRef.current = true;
        return;
      }

      // Show message immediately (non-blocking)
      setMessages((prev) => {
        const exists = prev.some((msg) =>
          msg.id === message.id ||
          (msg.id.startsWith("temp-") &&
            msg.senderId === message.senderId &&
            msg.receiverId === message.receiverId &&
            msg.content === message.content &&
            Math.abs(new Date(msg.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000)
        );
        if (!exists) {
          const updated = [...prev, message];
          if (selectedUserId) {
            messagesCacheRef.current.set(selectedUserId, updated);
          }
          return updated;
        }
        return prev;
      });

      // Decrypt in background (non-blocking UI)
      if (
        encryption &&
        message.encryptedContent &&
        message.senderId !== userId &&
        encryption.hasKeys
      ) {
        let senderPublicKey: string | undefined = publicKeyCacheRef.current.get(message.senderId);

        if (!senderPublicKey && encryption.getUserPublicKey) {
          try {
            const fetchedKey = await encryption.getUserPublicKey(message.senderId);
            if (fetchedKey) {
              senderPublicKey = fetchedKey;
              publicKeyCacheRef.current.set(message.senderId, fetchedKey);
            }
          } catch (error) {
            console.error("Error fetching public key:", error);
          }
        }

        if (senderPublicKey) {
          try {
            const encrypted = JSON.parse(message.encryptedContent);
            const decrypted = await encryption.decryptFromUser(
              encrypted,
              senderPublicKey
            );
            if (decrypted) {
              setMessages((prev) => {
                const updated = prev.map((msg) =>
                  msg.id === message.id
                    ? { ...msg, content: decrypted }
                    : msg
                );
                if (selectedUserId) {
                  messagesCacheRef.current.set(selectedUserId, updated);
                }
                return updated;
              });
            }
          } catch (error) {
            console.error("Error decrypting incoming message:", error);
          }
        }
      }

      // Mark as read if message from selected user
      if (message.senderId === selectedUserId && message.receiverId === userId) {
        setTimeout(() => {
          markAsRead(selectedUserId);
        }, 500);
      }

      refreshConversationsThrottled();
    };

    const handleMessageDelivered = (data: { messageId: string }) => {
      setMessages((prev) => {
        const updated = prev.map((msg) => {
          if (msg.id === data.messageId && msg.senderId === userId) {
            return { ...msg, deliveredAt: new Date().toISOString() };
          }
          return msg;
        });
        if (selectedUserId) {
          messagesCacheRef.current.set(selectedUserId, updated);
        }
        return updated;
      });
    };

    const handleMessagesRead = (data: { receiverId: string; readAt: string; messageIds?: string[] }) => {
      if (data.receiverId === selectedUserId && userId) {
        setMessages((prev) => {
          const updated = prev.map((msg) => {
            if (data.messageIds && data.messageIds.length > 0) {
              if (data.messageIds.includes(msg.id)) {
                return { ...msg, read: true, readAt: data.readAt };
              }
              return msg;
            }

            if (
              msg.senderId === userId &&
              msg.receiverId === data.receiverId &&
              (!msg.readAt || new Date(msg.readAt) < new Date(data.readAt))
            ) {
              return { ...msg, read: true, readAt: data.readAt };
            }
            return msg;
          });
          if (selectedUserId) {
            messagesCacheRef.current.set(selectedUserId, updated);
          }
          return updated;
        });
      }

      refreshConversationsThrottled();
    };

    const handleConnect = () => {
      console.log("✅ Socket connected in messages page", socket.id);
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected in messages page");
    };

    socket.on("newDirectMessage", handleNewDirectMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("newDirectMessage", handleNewDirectMessage);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [
    socket,
    userId,
    selectedUserId,
    encryption,
    setMessages,
    markAsRead,
    refreshConversationsThrottled,
    messagesCacheRef,
    publicKeyCacheRef,
    shouldAutoScrollRef,
  ]);
}

