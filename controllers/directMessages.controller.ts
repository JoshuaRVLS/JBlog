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

    // Get IO instance first
    const io = getIO();
    
    // OPTIMIZATION: Emit optimistic message immediately to receiver (before DB save)
    // This reduces perceived latency significantly
    const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage = {
      id: tempMessageId,
      content: encryptedContent ? "" : messageContent,
      encryptedContent: encryptedContent || null,
      encryptedMediaUrl: encryptedMediaUrl || null,
      encryptionKeyId: encryptionKeyId || null,
      type,
      mediaUrl: mediaUrl || null,
      senderId,
      receiverId,
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

    // Emit optimistic message to receiver immediately (non-blocking)
    if (io) {
      io.to(`user:${receiverId}`).emit("newDirectMessage", optimisticMessage);
      
      // Emit conversation update to BOTH sender and receiver so list updates immediately (like WhatsApp)
      // Include user info to avoid async fetch on frontend (faster!)
      const conversationUpdateForReceiver = {
        userId: senderId, // The sender (other user in conversation for receiver)
        user: {
          id: sender.id,
          name: sender.name,
          profilePicture: sender.profilePicture,
        },
        lastMessage: {
          id: tempMessageId,
          content: encryptedContent ? "" : messageContent,
          senderId,
          receiverId,
          createdAt: optimisticMessage.createdAt,
        },
        unreadCount: 1, // Receiver has 1 unread
      };
      
      const conversationUpdateForSender = {
        userId: receiverId, // The receiver (other user in conversation for sender)
        user: {
          id: receiver.id,
          name: receiver.name,
          profilePicture: receiver.profilePicture,
        },
        lastMessage: {
          id: tempMessageId,
          content: encryptedContent ? "" : messageContent,
          senderId,
          receiverId,
          createdAt: optimisticMessage.createdAt,
        },
        unreadCount: 0, // Sender has no unread
      };
      
      // Update receiver's conversation list (new message from sender) - IMMEDIATE
      io.to(`user:${receiverId}`).emit("conversationUpdated", conversationUpdateForReceiver);
      
      // Update sender's conversation list (they sent a message) - IMMEDIATE
      io.to(`user:${senderId}`).emit("conversationUpdated", conversationUpdateForSender);
    }

    // Save to database (non-blocking, don't wait for notification)
    const messagePromise = db.directMessage.create({
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

    // Emit real message to receiver (sender sudah punya optimistic message dari frontend)
    messagePromise.then((message) => {
      if (io) {
        // Emit ke receiver dengan real message
        io.to(`user:${receiverId}`).emit("newDirectMessage", {
          ...message,
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
        });
        
        // Emit messageDelivered dengan real message ID untuk update optimistic message di sender
        io.to(`user:${senderId}`).emit("messageDelivered", { 
          messageId: message.id,
          tempMessageId: null,
        });

        // Emit conversation update to BOTH users for real-time list update (like WhatsApp)
        // This ensures conversation list updates immediately when new message arrives
        const conversationUpdate = {
          userId: receiverId, // The other user in conversation
          lastMessage: {
            id: message.id,
            content: encryptedContent ? "" : messageContent,
            senderId,
            receiverId,
            createdAt: message.createdAt.toISOString(),
          },
          unreadCount: 1, // Receiver has 1 unread
          sender: {
            id: sender.id,
            name: sender.name,
            profilePicture: sender.profilePicture,
          },
        };
        
        // Update receiver's conversation list (new message from sender - move to top)
        io.to(`user:${receiverId}`).emit("conversationUpdated", conversationUpdate);
        
        // Update sender's conversation list (they sent a message - move to top)
        io.to(`user:${senderId}`).emit("conversationUpdated", {
          ...conversationUpdate,
          userId: senderId,
          unreadCount: 0, // Sender has no unread
        });
      }
    }).catch((err) => {
      console.error("Error in message promise:", err);
    });

    // Create notification async (don't block response)
    createNotification({
      type: "direct_message",
      userId: receiverId,
      actorId: senderId,
    }).then((notification) => {
      if (notification && io) {
        io.to(`user:${receiverId}`).emit("new-notification", notification);
      }
    }).catch((err) => {
      console.error("Error creating notification:", err);
    });

    // Wait for message to be saved, then update with real ID
    const message = await messagePromise;

    // Update receiver with real message ID (replace temp message)
    if (io) {
      io.to(`user:${receiverId}`).emit("messageUpdated", {
        tempId: tempMessageId,
        realId: message.id,
        message: {
          ...message,
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
        },
      });
      
      // Emit messageDelivered dengan real message ID untuk update optimistic message di sender
      io.to(`user:${senderId}`).emit("messageDelivered", { 
        messageId: message.id,
        tempMessageId: null,
      });
    }

    // Return response immediately (don't wait for notification)
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

    // Optimize: Get only last message per conversation using subquery (much faster)
    // First, get all unique conversation partners
    const conversationPartners = await db.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
      distinct: ["senderId", "receiverId"],
    });

    // Get unique other user IDs
    const otherUserIdsSet = new Set<string>();
    for (const msg of conversationPartners) {
      if (msg.senderId === userId) {
        otherUserIdsSet.add(msg.receiverId);
      } else {
        otherUserIdsSet.add(msg.senderId);
      }
    }
    const otherUserIds = Array.from(otherUserIdsSet);

    if (otherUserIds.length === 0) {
      return res.json({ conversations: [] });
    }

    // Get last message for each conversation partner (optimized query)
    const lastMessages = await Promise.all(
      otherUserIds.map(async (otherUserId) => {
        const lastMessage = await db.directMessage.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
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
          take: 1,
        });
        return { otherUserId, lastMessage };
      })
    );

    // Get user info for all partners in one query
    const users = await db.user.findMany({
      where: {
        id: { in: otherUserIds },
      },
      select: {
        id: true,
        name: true,
        profilePicture: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Build conversation map
    const conversationMap = new Map<string, {
      lastMessage: typeof lastMessages[0]["lastMessage"];
      otherUser: { id: string; name: string; profilePicture: string | null };
    }>();

    for (const { otherUserId, lastMessage } of lastMessages) {
      if (lastMessage && userMap.has(otherUserId)) {
        const otherUser = userMap.get(otherUserId)!;
        conversationMap.set(otherUserId, {
          lastMessage,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            profilePicture: otherUser.profilePicture,
          },
        });
      }
    }

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
    
    // Get messages that will be updated (for logging)
    const messagesToUpdate = await db.directMessage.findMany({
      where: {
        senderId,
        receiverId,
        read: false,
      },
      select: { id: true },
    });
    
    // Update all unread messages
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

    // Emit read receipts to sender dengan informasi lengkap
    const io = getIO();
    if (io && updatedMessages.count > 0) {
      // Emit dengan message IDs yang di-update untuk lebih akurat
      io.to(`user:${senderId}`).emit("messagesRead", {
        receiverId,
        readAt: now.toISOString(),
        messageIds: messagesToUpdate.map(m => m.id), // List message IDs yang di-update
      });
      
      console.log(`[Read Receipt] Marked ${updatedMessages.count} messages as read from ${senderId} to ${receiverId}`);
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

