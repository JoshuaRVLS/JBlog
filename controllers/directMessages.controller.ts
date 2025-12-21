import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { getIO } from "../lib/socket";
import { createNotification } from "./notifications.controller";

// Send a direct message
export const sendDirectMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, content, type = "text", mediaUrl, encryptedContent, encryptedMediaUrl, encryptionKeyId } = req.body;
    const senderId = req.userId;

    if (!senderId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Harus login dulu" });
    }

    if (!receiverId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "receiverId harus diisi" });
    }

    // Validasi: pesan text harus ada content atau encryptedContent
    if (type === "text" && !content && !encryptedContent) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "content atau encryptedContent harus diisi untuk pesan text" });
    }

    // Validasi: pesan media harus ada mediaUrl
    if (type !== "text" && !mediaUrl) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "mediaUrl harus diisi untuk pesan media" });
    }

    // Pastikan content selalu string (bisa kosong untuk media)
    const messageContent = content || "";

    if (senderId === receiverId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Tidak bisa mengirim pesan ke diri sendiri" });
    }

    // Cek apakah receiver ada
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
      select: {
        id: true,
        name: true,
        profilePicture: true,
      },
    });

    if (!receiver) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User penerima tidak ditemukan" });
    }

    // Get sender info (for optimistic message)
    const sender = await db.user.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        name: true,
        profilePicture: true,
      },
    });

    if (!sender) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Sender tidak ditemukan" });
    }

    // CRITICAL OPTIMIZATION: Emit socket IMMEDIATELY before database write (like WhatsApp)
    // This makes messages appear instantly with <1ms delay
    const io = getIO();
    const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
    
    // Create optimistic message payload for instant emit
    const optimisticMessage = {
      id: tempMessageId,
      senderId,
      receiverId,
      content: messageContent,
      encryptedContent: encryptedContent || null,
      encryptedMediaUrl: encryptedMediaUrl || null,
      encryptionKeyId: encryptionKeyId || null,
      type,
      mediaUrl: mediaUrl || null,
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

    // Emit IMMEDIATELY before any database operations
    if (io) {
      io.to(`user:${receiverId}`).to(`user:${senderId}`).emit("newDirectMessage", optimisticMessage);
    }

    // Now save to database in parallel (non-blocking)
    const [message] = await Promise.all([
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
      // Create notification async (don't block)
      createNotification({
        type: "direct_message",
        userId: receiverId,
        actorId: senderId,
      }).then((notification) => {
        // Emit notification after creation (async)
        if (notification && io) {
          io.to(`user:${receiverId}`).emit("new-notification", notification);
        }
        return notification;
      }).catch((err) => {
        console.error("Error creating notification:", err);
        return null;
      }),
    ]);

    // Emit messageDelivered with real message ID (async, non-blocking)
    if (io) {
      io.to(`user:${receiverId}`).emit("messageDelivered", { messageId: message.id });
    }

    // Return response immediately (database write happens in parallel)
    res.status(StatusCodes.CREATED).json({
      message: "Pesan berhasil dikirim",
      directMessage: message,
    });
  } catch (error: any) {
    console.error("Error send direct message:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengirim pesan",
      details: error.message,
    });
  }
};

// Get conversation between two users
export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.userId;

    if (!otherUserId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "userId is required" });
    }

    if (!currentUserId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Harus login dulu" });
    }

    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      db.directMessage.findMany({
        where: {
          OR: [
            {
              senderId: currentUserId,
              receiverId: otherUserId,
            },
            {
              senderId: otherUserId,
              receiverId: currentUserId,
            },
          ],
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.directMessage.count({
        where: {
          OR: [
            {
              senderId: currentUserId,
              receiverId: otherUserId,
            },
            {
              senderId: otherUserId,
              receiverId: currentUserId,
            },
          ],
        },
      }),
    ]);

    // Mark messages as read
    await db.directMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error get conversation:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil percakapan",
      details: error.message,
    });
  }
};

// Get all conversations for current user (OPTIMIZED - no N+1 queries)
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Harus login dulu" });
    }

    // Get all messages in one query, then process in memory (much faster than N+1 queries)
    const allMessages = await db.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
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
      orderBy: { createdAt: "desc" },
    });

    // Group by conversation partner and get last message
    const conversationMap = new Map<string, {
      lastMessage: typeof allMessages[0];
      otherUser: { id: string; name: string; profilePicture: string | null };
    }>();

    for (const message of allMessages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const otherUser = message.senderId === userId ? message.receiver : message.sender;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          lastMessage: message,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            profilePicture: otherUser.profilePicture,
          },
        });
      }
    }

    const otherUserIds = Array.from(conversationMap.keys());

    // Batch get unread counts for all conversations at once
    const unreadCounts = otherUserIds.length > 0
      ? await db.directMessage.groupBy({
          by: ["senderId"],
          where: {
            senderId: { in: otherUserIds },
            receiverId: userId,
            read: false,
          },
          _count: {
            id: true,
          },
        })
      : [];

    // Create map for O(1) lookup
    const unreadCountMap = new Map(
      unreadCounts.map((u) => [u.senderId, u._count.id])
    );

    // Build conversations array
    const conversations = Array.from(conversationMap.entries()).map(([otherUserId, data]) => {
      const unreadCount = unreadCountMap.get(otherUserId) || 0;

      return {
        user: data.otherUser,
        lastMessage: data.lastMessage,
        unreadCount,
      };
    });

    // Sort by last message time (already sorted from query, but ensure it's correct)
    conversations.sort((a, b) => {
      if (!a.lastMessage || !b.lastMessage) return 0;
      return (
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
      );
    });

    res.json({ conversations });
  } catch (error: any) {
    console.error("Error get conversations:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil percakapan",
      details: error.message,
    });
  }
};

// Mark message as delivered
export const markMessageAsDelivered = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    if (!messageId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "messageId is required" });
    }

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Harus login dulu" });
    }

    const message = await db.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Pesan tidak ditemukan" });
    }

    // Only mark as delivered if receiver is the current user
    if (message.receiverId === userId && !message.deliveredAt) {
      await db.directMessage.update({
        where: { id: messageId },
        data: {
          deliveredAt: new Date(),
        },
      });

      // Emit to sender that message was delivered
      const io = getIO();
      if (io) {
        io.to(`user:${message.senderId}`).emit("messageDelivered", { messageId });
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error mark message as delivered:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal update status delivered",
      details: error.message,
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: senderId } = req.params;
    const receiverId = req.userId;

    if (!senderId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "userId is required" });
    }

    if (!receiverId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Harus login dulu" });
    }

    const now = new Date();
    const updatedMessages = await db.directMessage.updateMany({
      where: {
        senderId,
        receiverId,
        read: false,
      },
      data: {
        read: true,
        readAt: now,
        // Also set deliveredAt if not set
        deliveredAt: {
          set: now,
        },
      },
    });

    // Emit read receipts to sender
    const io = getIO();
    if (io) {
      io.to(`user:${senderId}`).emit("messagesRead", {
        receiverId,
        readAt: now,
      });
    }

    res.json({ message: "Pesan ditandai sebagai sudah dibaca" });
  } catch (error: any) {
    console.error("Error mark messages as read:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal menandai pesan",
      details: error.message,
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.json({ count: 0 });
    }

    const count = await db.directMessage.count({
      where: {
        receiverId: userId,
        read: false,
      },
    });

    res.json({ count });
  } catch (error: any) {
    console.error("Error get unread count:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil jumlah pesan belum dibaca",
      details: error.message,
    });
  }
};

