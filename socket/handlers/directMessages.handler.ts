import type { Socket, Server } from "socket.io";
import db from "../../lib/db";
import { getIO } from "../../lib/socket";
import { createNotification } from "../../controllers/notifications.controller";

export function setupDirectMessageHandlers(socket: Socket, io: Server): void {
  // Handle new direct message via socket (for real-time delivery)
  socket.on("send-direct-message", async (data: {
    receiverId: string;
    content?: string;
    encryptedContent?: string;
    encryptedMediaUrl?: string;
    encryptionKeyId?: string;
    type?: string;
    mediaUrl?: string;
  }) => {
    try {
      const { receiverId, content, encryptedContent, encryptedMediaUrl, encryptionKeyId, type = "text", mediaUrl } = data;
      const senderId = socket.data.userId;

      if (!receiverId) {
        socket.emit("error", { msg: "receiverId harus diisi" });
        return;
      }

      // Validasi: pesan text harus ada content atau encryptedContent
      if (type === "text" && !content && !encryptedContent) {
        socket.emit("error", { msg: "content atau encryptedContent harus diisi untuk pesan text" });
        return;
      }

      // Validasi: pesan media harus ada mediaUrl
      if (type !== "text" && !mediaUrl) {
        socket.emit("error", { msg: "mediaUrl harus diisi untuk pesan media" });
        return;
      }

      if (senderId === receiverId) {
        socket.emit("error", { msg: "Tidak bisa mengirim pesan ke diri sendiri" });
        return;
      }

      // Get receiver and sender info in parallel
      const [receiver, sender] = await Promise.all([
        db.user.findUnique({
          where: { id: receiverId },
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        }),
        db.user.findUnique({
          where: { id: senderId },
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        }),
      ]);

      if (!receiver) {
        socket.emit("error", { msg: "User penerima tidak ditemukan" });
        return;
      }

      if (!sender) {
        socket.emit("error", { msg: "Sender tidak ditemukan" });
        return;
      }

      const messageContent = content || "";

      // OPTIMISTIC UPDATE: Emit to receiver immediately before saving
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage = {
        id: tempMessageId,
        content: messageContent,
        encryptedContent: encryptedContent || null,
        encryptedMediaUrl: encryptedMediaUrl || null,
        encryptionKeyId: encryptionKeyId || null,
        type: type,
        mediaUrl: mediaUrl || null,
        senderId: senderId,
        receiverId: receiverId,
        read: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: sender.id,
          name: sender.name,
          profilePicture: sender.profilePicture,
        },
        receiver: {
          id: receiver.id,
          name: receiver.name,
          profilePicture: receiver.profilePicture,
        },
      };

      // Emit to receiver IMMEDIATELY (ultra-low latency)
      io.to(`user:${receiverId}`).emit("newDirectMessage", optimisticMessage);

      // Save to database and create notification in parallel
      const [message, notification] = await Promise.all([
        db.directMessage.create({
          data: {
            senderId,
            receiverId,
            content: messageContent,
            encryptedContent: encryptedContent || null,
            encryptedMediaUrl: encryptedMediaUrl || null,
            encryptionKeyId: encryptionKeyId || null,
            type,
            mediaUrl,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        }),
        createNotification({
          type: "direct_message",
          userId: receiverId,
          actorId: senderId,
        }).catch((err) => {
          console.error("Error creating notification:", err);
          return null;
        }),
      ]);

      // Emit real message to replace optimistic message
      io.to(`user:${receiverId}`).emit("message-updated", {
        tempId: tempMessageId,
        realId: message.id,
        message,
      });

      // Emit to sender for confirmation (with real message ID)
      io.to(`user:${senderId}`).emit("messageDelivered", {
        messageId: message.id,
        tempMessageId: tempMessageId,
      });

      // Emit notification if created
      if (notification) {
        io.to(`user:${receiverId}`).emit("new-notification", notification);
      }

      // Emit conversation update event to both users (for auto-add new conversation)
      const conversationUpdate = {
        userId: receiverId,
        otherUserId: senderId,
        lastMessage: {
          id: message.id,
          content: messageContent,
          encryptedContent: encryptedContent || null,
          type: type,
          createdAt: message.createdAt.toISOString(),
        },
        otherUser: {
          id: sender.id,
          name: sender.name,
          profilePicture: sender.profilePicture,
        },
      };

      // Emit to both users so conversation list updates in real-time
      io.to(`user:${receiverId}`).emit("conversation-updated", conversationUpdate);
      io.to(`user:${senderId}`).emit("conversation-updated", {
        ...conversationUpdate,
        userId: senderId,
        otherUserId: receiverId,
        otherUser: {
          id: receiver.id,
          name: receiver.name,
          profilePicture: receiver.profilePicture,
        },
      });

      console.log(`Direct message sent from ${sender.name} to ${receiver.name}`);
    } catch (error: any) {
      console.error("Error sending direct message via socket:", error);
      socket.emit("error", { msg: "Gagal mengirim pesan" });
    }
  });
}

