import { useState, useEffect, useRef, useMemo } from "react";
import { Message } from "../types";

interface UseMessageDecryptionProps {
  processedMessages: Message[];
  encryption: any;
  selectedUserId: string | null;
  userId: string | null;
}

export function useMessageDecryption({
  processedMessages,
  encryption,
  selectedUserId,
  userId,
}: UseMessageDecryptionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [decrypting, setDecrypting] = useState(false);
  const decryptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousProcessedMessagesRef = useRef<Message[]>([]);

  useEffect(() => {
    if (decryptTimeoutRef.current) {
      clearTimeout(decryptTimeoutRef.current);
    }

    const currentIds = processedMessages.map(m => m.id).join(',');
    const previousIds = previousProcessedMessagesRef.current.map(m => m.id).join(',');

    if (currentIds === previousIds && processedMessages.length === previousProcessedMessagesRef.current.length) {
      return;
    }

    previousProcessedMessagesRef.current = processedMessages;

    if (!encryption || !encryption.hasKeys || !selectedUserId) {
      setMessages((prev) => {
        const prevIds = prev.map(m => m.id).join(',');
        if (prevIds === currentIds && prev.length === processedMessages.length) {
          return prev;
        }
        return processedMessages;
      });
      return;
    }

    decryptTimeoutRef.current = setTimeout(async () => {
      setDecrypting(true);

      const BATCH_SIZE = 10;
      const decrypted: Message[] = [];

      for (let i = 0; i < processedMessages.length; i += BATCH_SIZE) {
        const batch = processedMessages.slice(i, i + BATCH_SIZE);
        const batchDecrypted = await Promise.all(
          batch.map(async (msg: Message) => {
            if (msg.isDecrypted || !msg.encryptedContent) {
              return msg;
            }

            if (msg.senderId !== userId) {
              try {
                const senderPublicKey = await encryption.getUserPublicKey(msg.senderId);
                if (senderPublicKey) {
                  let encrypted;
                  try {
                    encrypted = typeof msg.encryptedContent === 'string'
                      ? JSON.parse(msg.encryptedContent)
                      : msg.encryptedContent;
                  } catch (parseError) {
                    return msg;
                  }

                  const decryptedContent = await encryption.decryptFromUser(
                    encrypted,
                    senderPublicKey
                  );
                  if (decryptedContent) {
                    return { ...msg, content: decryptedContent, isDecrypted: true };
                  }
                }
              } catch (error) {
                return msg;
              }
            }
            return msg;
          })
        );
        decrypted.push(...batchDecrypted);
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      setMessages((currentMessages) => {
        const messageMap = new Map<string, Message>();

        currentMessages.forEach((msg) => {
          messageMap.set(msg.id, msg);
        });

        decrypted.forEach((decryptedMsg) => {
          messageMap.set(decryptedMsg.id, decryptedMsg);
        });

        const finalMessages = Array.from(messageMap.values()).sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const finalIds = finalMessages.map(m => m.id).join(',');
        const currentIds = currentMessages.map(m => m.id).join(',');
        const finalContents = finalMessages.map(m => `${m.id}:${m.content}`).join('|');
        const currentContents = currentMessages.map(m => `${m.id}:${m.content}`).join('|');

        if (finalIds === currentIds &&
          finalMessages.length === currentMessages.length &&
          finalContents === currentContents) {
          return currentMessages;
        }

        return finalMessages;
      });

      setDecrypting(false);
    }, 100);

    return () => {
      if (decryptTimeoutRef.current) {
        clearTimeout(decryptTimeoutRef.current);
      }
    };
  }, [processedMessages, encryption, selectedUserId, userId]);

  return {
    messages,
    setMessages,
    decrypting,
  };
}

