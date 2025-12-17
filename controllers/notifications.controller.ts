import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

// Helper function to create notification
export const createNotification = async (data: {
  type: "like" | "comment" | "reply" | "mention" | "repost" | "share" | "direct_message";
  userId: string; // User yang menerima notifikasi
  actorId: string; // User yang melakukan aksi
  postId?: string;
  commentId?: string;
  messageId?: string;
  groupChatId?: string;
}) => {
  try {
    // Jangan buat notifikasi jika user melakukan aksi pada post/comment miliknya sendiri
    if (data.userId === data.actorId) {
      return null;
    }

    // Untuk like, cek apakah sudah ada notifikasi yang sama (untuk grouping)
    if (data.type === "like" && data.postId) {
      const existingNotification = await db.notification.findFirst({
        where: {
          type: "like",
          userId: data.userId,
          postId: data.postId,
          read: false,
        },
      });

      // Jika sudah ada, tidak perlu buat baru (akan di-group)
      if (existingNotification) {
        return existingNotification;
      }
    }

    const notification = await db.notification.create({
      data: {
        type: data.type,
        userId: data.userId,
        actorId: data.actorId,
        postId: data.postId || null,
        commentId: data.commentId || null,
        messageId: data.messageId || null,
        groupChatId: data.groupChatId || null,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
        groupChat: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    return null;
  }
};

// Get notifications dengan grouping seperti Instagram
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { limit = 50, offset = 0 } = req.query;

    // Get all notifications
    const notifications = await db.notification.findMany({
      where: { userId },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
        groupChat: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });

    // Group notifications seperti Instagram
    const groupedNotifications: any[] = [];
    const groupedMap = new Map<string, any>();

    notifications.forEach((notification) => {
      // Group by type + postId/commentId/messageId
      let groupKey: string;
      
      if (notification.type === "like" && notification.postId) {
        groupKey = `like-post-${notification.postId}`;
      } else if (notification.type === "repost" && notification.postId) {
        groupKey = `repost-post-${notification.postId}`;
      } else if (notification.type === "comment" && notification.postId) {
        groupKey = `comment-post-${notification.postId}`;
      } else if (notification.type === "reply" && notification.commentId) {
        groupKey = `reply-comment-${notification.commentId}`;
      } else if (notification.type === "mention" && notification.messageId) {
        groupKey = `mention-message-${notification.messageId}`;
      } else {
        // Tidak bisa di-group, tambahkan langsung
        groupedNotifications.push({
          ...notification,
          actors: [notification.actor],
          count: 1,
        });
        return;
      }

      if (groupedMap.has(groupKey)) {
        const group = groupedMap.get(groupKey);
        // Tambahkan actor jika belum ada
        const actorExists = group.actors.some((a: any) => a.id === notification.actorId);
        if (!actorExists) {
          group.actors.push(notification.actor);
        }
        group.count++;
        // Update createdAt ke yang terbaru
        if (new Date(notification.createdAt) > new Date(group.createdAt)) {
          group.createdAt = notification.createdAt;
        }
      } else {
        const group = {
          ...notification,
          actors: [notification.actor],
          count: 1,
        };
        groupedMap.set(groupKey, group);
        groupedNotifications.push(group);
      }
    });

    // Sort by createdAt (terbaru dulu)
    groupedNotifications.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({ notifications: groupedNotifications });
  } catch (error: any) {
    console.error("❌ Error fetching notifications:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil notifications",
      details: error.message,
    });
  }
};

// Get unread count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const count = await db.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    res.json({ count });
  } catch (error: any) {
    console.error("❌ Error fetching unread count:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil unread count",
      details: error.message,
    });
  }
};

// Mark as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { id } = req.params;

    if (id === "all") {
      // Mark all as read
      await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return res.json({ msg: "Semua notifikasi ditandai sebagai sudah dibaca" });
    }

    // Mark single notification as read
    const notification = await db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Notifikasi tidak ditemukan" });
    }

    await db.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({ msg: "Notifikasi ditandai sebagai sudah dibaca" });
  } catch (error: any) {
    console.error("❌ Error marking notification as read:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal menandai notifikasi",
      details: error.message,
    });
  }
};

// Mark all as read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ msg: "Semua notifikasi ditandai sebagai sudah dibaca" });
  } catch (error: any) {
    console.error("❌ Error marking all notifications as read:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal menandai semua notifikasi",
      details: error.message,
    });
  }
};

