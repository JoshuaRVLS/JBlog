import type { Socket, Server } from "socket.io";
import db from "../../lib/db";
import { createNotification } from "../../controllers/notifications.controller";
import { getIO } from "../../lib/socket";

export function setupGroupChatHandlers(socket: Socket, io: Server): void {
  // Join group chat room
  socket.on("join-group", async (groupId: string) => {
    try {
      // Verify user is member of the group
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

      // Notify others in the group
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
      
      // Verify user is member of the group
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
        return;
      }

      if (!groupChat.isPublic && !member) {
        return;
      }

      // Broadcast typing event to other users in the group
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
      
      // Verify user is member of the group
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
        return;
      }

      if (!groupChat.isPublic && !member) {
        return;
      }

      // Broadcast stop typing event to other users in the group
      socket.to(`group:${groupId}`).emit("user-stop-typing", {
        userId: socket.data.userId,
      });
    } catch (error: any) {
      console.error("Error handling stop typing:", error);
    }
  });

  // Send message - OPTIMIZED for ultra-low latency
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

      // For text messages, either content or encryptedContent is required
      if (type === "text" && (!content || content.trim().length === 0) && !encryptedContent) {
        socket.emit("error", { msg: "Pesan tidak boleh kosong" });
        return;
      }

      // For media messages, mediaUrl is required
      if (type !== "text" && !mediaUrl) {
        socket.emit("error", { msg: "Media URL tidak ditemukan" });
        return;
      }

      // Verify user is member (parallel with message parsing)
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

      // Parse mentions from content (@username) - only for text messages
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

      // Get all group members to match mentions (parallel)
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

      // Find mentioned users
      const mentionedUserIds: string[] = [];
      for (const mention of mentions) {
        const member = groupMembers.find(
          (m) => m.user.name.toLowerCase() === mention.toLowerCase()
        );
        if (member && member.userId !== socket.data.userId) {
          mentionedUserIds.push(member.userId);
        }
      }

      // OPTIMISTIC UPDATE: Emit message immediately before saving to DB
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

      // Broadcast pesan ke semua member group IMMEDIATELY (ultra-low latency)
      io.to(`group:${groupId}`).emit("new-message", optimisticMessage);

      // Save to database in parallel with notification creation
      const [message] = await Promise.all([
        db.message.create({
          data: {
            content: encryptedContent ? "" : (content?.trim() || ""),
            encryptedContent: encryptedContent ?? null,
            encryptionKeyId: encryptionKeyId || null,
            type: type,
            mediaUrl: mediaUrl || null,
            mediaThumbnail: mediaThumbnail || null,
            groupChatId: groupId,
            userId: socket.data.userId,
            mentions: {
              create: mentionedUserIds.map((mentionedUserId) => ({
                mentionedUserId,
              })),
            },
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
        }),
        // Update timestamp group chat (non-blocking)
        db.groupChat.update({
          where: { id: groupId },
          data: { updatedAt: new Date() },
        }).catch((err) => console.error("Error updating group chat:", err)),
      ]);

      // Update pesan dengan ID yang beneran dari database
      io.to(`group:${groupId}`).emit("message-updated", {
        tempId: tempMessageId,
        realId: message.id,
        message,
      });

      // Buat notifikasi untuk user yang di-mention (async, non-blocking)
      if (mentionedUserIds.length > 0) {
        Promise.all(
          mentionedUserIds.map(async (mentionedUserId) => {
            try {
              const notification = await createNotification({
                type: "mention",
                userId: mentionedUserId,
                actorId: socket.data.userId,
                messageId: message.id,
                groupChatId: groupId,
              });
              
              // Kirim notifikasi real-time
              io.to(`user:${mentionedUserId}`).emit("new-notification", notification);
            } catch (err) {
              console.error("Error creating mention notification:", err);
            }
          })
        ).catch((err) => console.error("Error in notification creation:", err));
      }

      console.log(`Message sent in group ${groupId} by ${socket.data.user.name} (type: ${type})`);
    } catch (error: any) {
      console.error("Error sending message:", error);
      socket.emit("error", { msg: "Gagal mengirim pesan" });
    }
  });
}

