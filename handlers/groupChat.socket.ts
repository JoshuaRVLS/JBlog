import type { Server, Socket } from "socket.io";
import db from "../lib/db";
import { createNotification } from "../controllers/notifications.controller";

export function setupGroupChatHandlers(io: Server, socket: Socket): void {
  // Join group chat room
  socket.on("join-group", async (groupId: string) => {
    try {
      const member = await db.groupChatMember.findUnique({
        where: {
          groupChatId_userId: {
            groupChatId: groupId,
            userId: socket.data.userId,
          },
        },
      });

      const groupChat = await db.groupChat.findUnique({
        where: { id: groupId },
      });

      if (!groupChat) {
        socket.emit("error", { msg: "Group chat tidak ditemukan" });
        return;
      }

      if (!groupChat.isPublic && !member) {
        socket.emit("error", { msg: "Kamu bukan member group ini" });
        return;
      }

      socket.join(`group:${groupId}`);
      console.log(`User ${socket.data.user.name} joined group ${groupId}`);

      socket.to(`group:${groupId}`).emit("user-joined", {
        userId: socket.data.userId,
        userName: socket.data.user.name,
      });
    } catch (error: any) {
      console.error("Error joining group:", error);
      socket.emit("error", { msg: "Gagal join group" });
    }
  });

  // Leave group chat room
  socket.on("leave-group", (groupId: string) => {
    socket.leave(`group:${groupId}`);
    console.log(`User ${socket.data.user.name} left group ${groupId}`);
  });

  // Typing indicator
  socket.on("typing", async (data: { groupId: string }) => {
    try {
      const { groupId } = data;
      
      const member = await db.groupChatMember.findUnique({
        where: {
          groupChatId_userId: {
            groupChatId: groupId,
            userId: socket.data.userId,
          },
        },
      });

      const groupChat = await db.groupChat.findUnique({
        where: { id: groupId },
      });

      if (!groupChat || (!groupChat.isPublic && !member)) {
        return;
      }

      socket.to(`group:${groupId}`).emit("user-typing", {
        userId: socket.data.userId,
        userName: socket.data.user.name,
      });
    } catch (error: any) {
      console.error("Error handling typing:", error);
    }
  });

  // Stop typing indicator
  socket.on("stop-typing", async (data: { groupId: string }) => {
    try {
      const { groupId } = data;
      
      const member = await db.groupChatMember.findUnique({
        where: {
          groupChatId_userId: {
            groupChatId: groupId,
            userId: socket.data.userId,
          },
        },
      });

      const groupChat = await db.groupChat.findUnique({
        where: { id: groupId },
      });

      if (!groupChat || (!groupChat.isPublic && !member)) {
        return;
      }

      socket.to(`group:${groupId}`).emit("user-stop-typing", {
        userId: socket.data.userId,
      });
    } catch (error: any) {
      console.error("Error handling stop typing:", error);
    }
  });

  // Send message (optimized for realtime)
  socket.on("send-message", async (data: { 
    groupId: string; 
    content?: string;
    encryptedContent?: string;
    encryptionKeyId?: string;
    type?: string;
    mediaUrl?: string;
    mediaThumbnail?: string;
  }) => {
    try {
      const { groupId, content, encryptedContent, encryptionKeyId, type = "text", mediaUrl, mediaThumbnail } = data;

      if (type === "text" && (!content || content.trim().length === 0) && !encryptedContent) {
        socket.emit("error", { msg: "Pesan tidak boleh kosong" });
        return;
      }

      if (type !== "text" && !mediaUrl) {
        socket.emit("error", { msg: "Media URL tidak ditemukan" });
        return;
      }

      // Verify membership (parallel queries for speed)
      const [member, groupChat] = await Promise.all([
        db.groupChatMember.findUnique({
          where: {
            groupChatId_userId: {
              groupChatId: groupId,
              userId: socket.data.userId,
            },
          },
        }),
        db.groupChat.findUnique({
          where: { id: groupId },
        }),
      ]);

      if (!groupChat) {
        socket.emit("error", { msg: "Group chat tidak ditemukan" });
        return;
      }

      if (!groupChat.isPublic && !member) {
        socket.emit("error", { msg: "Kamu bukan member group ini" });
        return;
      }

      // Parse mentions (only for text messages)
      const mentionRegex = /@(\w+)/g;
      const mentions: string[] = [];
      if (type === "text" && content) {
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
          if (match[1]) {
            mentions.push(match[1]);
          }
        }
      }

      // Get group members for mentions (only if there are mentions)
      let mentionedUserIds: string[] = [];
      if (mentions.length > 0) {
        const groupMembers = await db.groupChatMember.findMany({
          where: { groupChatId: groupId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        for (const mention of mentions) {
          const member = groupMembers.find(
            (m) => m.user.name.toLowerCase() === mention.toLowerCase()
          );
          if (member && member.userId !== socket.data.userId) {
            mentionedUserIds.push(member.userId);
          }
        }
      }

      // Optimistic message - send immediately for instant feedback
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage = {
        id: tempMessageId,
        content: encryptedContent ? "" : (content?.trim() || ""),
        encryptedContent: encryptedContent ?? null,
        encryptionKeyId: encryptionKeyId || null,
        type: type,
        mediaUrl: mediaUrl || null,
        mediaThumbnail: mediaThumbnail || null,
        groupChatId: groupId,
        userId: socket.data.userId,
        createdAt: new Date().toISOString(),
        user: {
          id: socket.data.userId,
          name: socket.data.user.name,
          profilePicture: socket.data.user.profilePicture,
        },
        reads: [],
      };

      // Broadcast immediately (before database save) for ultra-low latency
      io.to(`group:${groupId}`).emit("new-message", optimisticMessage);

      // Save to database (non-blocking, don't wait for completion)
      const messagePromise = db.message.create({
        data: {
          content: encryptedContent ? "" : (content?.trim() || ""),
          encryptedContent: encryptedContent ?? null,
          encryptionKeyId: encryptionKeyId || null,
          type: type,
          mediaUrl: mediaUrl || null,
          mediaThumbnail: mediaThumbnail || null,
          groupChatId: groupId,
          userId: socket.data.userId,
          mentions: mentionedUserIds.length > 0 ? {
            create: mentionedUserIds.map((mentionedUserId) => ({
              mentionedUserId,
            })),
          } : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
        },
      });

      // Update message with real ID (non-blocking)
      messagePromise.then((message) => {
        io.to(`group:${groupId}`).emit("message-updated", {
          tempId: tempMessageId,
          realId: message.id,
          message,
        });
      }).catch((err) => {
        console.error("Error saving message:", err);
        socket.emit("error", { msg: "Gagal menyimpan pesan" });
      });

      // Create notifications for mentions (non-blocking)
      if (mentionedUserIds.length > 0) {
        Promise.all(
          mentionedUserIds.map(async (mentionedUserId) => {
            try {
              const message = await messagePromise;
              const notification = await createNotification({
                type: "mention",
                userId: mentionedUserId,
                actorId: socket.data.userId,
                messageId: message.id,
                groupChatId: groupId,
              });
              
              io.to(`user:${mentionedUserId}`).emit("new-notification", notification);
            } catch (err) {
              console.error("Error creating mention notification:", err);
            }
          })
        ).catch((err) => console.error("Error in notification creation:", err));
      }

      // Update group chat timestamp (non-blocking)
      db.groupChat.update({
        where: { id: groupId },
        data: { updatedAt: new Date() },
      }).catch((err) => console.error("Error updating group chat:", err));

      console.log(`Message sent in group ${groupId} by ${socket.data.user.name} (type: ${type})`);
    } catch (error: any) {
      console.error("Error sending message:", error);
      socket.emit("error", { msg: "Gagal mengirim pesan" });
    }
  });
}

