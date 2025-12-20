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

    // For text messages, either plain content or encryptedContent must be provided.
    // For media messages, content can be empty but mediaUrl is required.
    if (type === "text" && !content && !encryptedContent) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "content atau encryptedContent harus diisi untuk pesan text" });
    }

    // For media messages, mediaUrl is required
    if (type !== "text" && !mediaUrl) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "mediaUrl harus diisi untuk pesan media" });
    }

    // Ensure content is always a string (can be empty for media messages)
    const messageContent = content || "";

    if (senderId === receiverId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Tidak bisa mengirim pesan ke diri sendiri" });
    }

    // Check if receiver exists
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User penerima tidak ditemukan" });
    }

    const message = await db.directMessage.create({
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
    });

    // Create notification untuk receiver
    const notification = await createNotification({
      type: "direct_message",
      userId: receiverId,
      actorId: senderId,
    });

    // Emit real-time event via Socket.IO to both sender and receiver rooms
    const io = getIO();
    if (io) {
      // Realtime DM di kedua sisi
      console.log(`📤 Emitting newDirectMessage to user:${receiverId} and user:${senderId}`);
      io.to(`user:${receiverId}`).to(`user:${senderId}`).emit("newDirectMessage", message);
      // Realtime notification badge / list untuk receiver
      if (notification) {
        io.to(`user:${receiverId}`).emit("new-notification", notification);
      }
      // Emit delivered event when receiver is online
      io.to(`user:${receiverId}`).emit("messageDelivered", { messageId: message.id });
    } else {
      console.warn("⚠️ Socket.IO instance not available");
    }

    console.log(`✅ User ${senderId} sent DM to ${receiverId}`);
    res.status(StatusCodes.CREATED).json({
      message: "Pesan berhasil dikirim",
      directMessage: message,
    });
  } catch (error: any) {
    console.error("❌ Error send direct message:", error);
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
    console.error("❌ Error get conversation:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil percakapan",
      details: error.message,
    });
  }
};

// Get all conversations for current user
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Harus login dulu" });
    }

    // Get all unique users that current user has conversations with
    const sentMessages = await db.directMessage.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ["receiverId"],
    });

    const receivedMessages = await db.directMessage.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ["senderId"],
    });

    const allUserIds = [
      ...new Set([
        ...sentMessages.map((m) => m.receiverId),
        ...receivedMessages.map((m) => m.senderId),
      ]),
    ];

    // Get last message for each conversation
    const conversations = await Promise.all(
      allUserIds.map(async (otherUserId) => {
        const lastMessage = await db.directMessage.findFirst({
          where: {
            OR: [
              {
                senderId: userId,
                receiverId: otherUserId,
              },
              {
                senderId: otherUserId,
                receiverId: userId,
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
        });

        const unreadCount = await db.directMessage.count({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            read: false,
          },
        });

        const otherUser =
          lastMessage?.senderId === userId
            ? lastMessage.receiver
            : lastMessage?.sender;

        return {
          user: otherUser,
          lastMessage,
          unreadCount,
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      if (!a.lastMessage || !b.lastMessage) return 0;
      return (
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
      );
    });

    res.json({ conversations });
  } catch (error: any) {
    console.error("❌ Error get conversations:", error);
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
    console.error("❌ Error mark message as delivered:", error);
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
    console.error("❌ Error mark messages as read:", error);
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
    console.error("❌ Error get unread count:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil jumlah pesan belum dibaca",
      details: error.message,
    });
  }
};

