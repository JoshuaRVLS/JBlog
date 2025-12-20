import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

// User Management
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          profilePicture: true,
          isOwner: true,
          isAdmin: true,
          isVerified: true,
          isSuspended: true,
          suspendedUntil: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      db.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error mengambil semua users:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil users" });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isAdmin, isOwner, isVerified } = req.body;

    // Cegah ubah status owner (hanya satu owner)
    if (isOwner !== undefined) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: "Tidak bisa ubah status owner" });
    }

    const user = await db.user.update({
      where: { id },
      data: {
        isAdmin: isAdmin !== undefined ? isAdmin : undefined,
        isVerified: isVerified !== undefined ? isVerified : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isOwner: true,
        isVerified: true,
      },
    });

    console.log(`✅ Role user diupdate - ID: ${id}`);
    res.json({ msg: "Role user berhasil diupdate", user });
  } catch (error) {
    console.error("❌ Error update role user:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengupdate user" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Cegah hapus owner
    const user = await db.user.findUnique({ where: { id } });
    if (user?.isOwner) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: "Tidak bisa hapus owner" });
    }

    await db.user.delete({ where: { id } });

    console.log(`✅ User dihapus - ID: ${id}`);
    res.json({ msg: "User berhasil dihapus" });
  } catch (error) {
    console.error("❌ Error hapus user:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal menghapus user" });
  }
};

// Admin Management
export const getAllAdmins = async (req: AuthRequest, res: Response) => {
  try {
    const admins = await db.user.findMany({
      where: {
        OR: [{ isAdmin: true }, { isOwner: true }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        isOwner: true,
        isAdmin: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: [
        { isOwner: "desc" },
        { createdAt: "asc" },
      ],
    });

    res.json({ admins });
  } catch (error) {
    console.error("❌ Error mengambil semua admins:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil admins" });
  }
};

export const createAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "User ID harus diisi" });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "User tidak ditemukan" });
    }

    if (user.isAdmin) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "User sudah jadi admin" });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { isAdmin: true },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isOwner: true,
      },
    });

    console.log(`✅ Admin dibuat - User: ${updatedUser.email}`);
    res.json({ msg: "Admin berhasil dibuat", user: updatedUser });
  } catch (error) {
    console.error("❌ Error membuat admin:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal membuat admin" });
  }
};

export const removeAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "User not found" });
    }

    if (user.isOwner) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: "Cannot remove owner admin status" });
    }

    await db.user.update({
      where: { id },
      data: { isAdmin: false },
    });

    res.json({ msg: "Admin removed successfully" });
  } catch (error) {
    console.error("Remove admin error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to remove admin" });
  }
};

export const suspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { days, reason } = req.body;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "User tidak ditemukan" });
    }

    if (user.isOwner) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: "Tidak bisa suspend owner" });
    }

    let suspendedUntil: Date | null = null;
    if (days && days > 0) {
      const daysCount = Math.min(Number(days), 365);
      suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + daysCount);
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { 
        isSuspended: true,
        suspendedUntil: suspendedUntil,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isSuspended: true,
        suspendedUntil: true,
      },
    });

    console.log(`✅ User di-suspend - ID: ${id}, Until: ${suspendedUntil || "Permanent"}`);
    res.json({ 
      msg: suspendedUntil 
        ? `User berhasil di-suspend selama ${days} hari` 
        : "User berhasil di-suspend secara permanen",
      user: updatedUser 
    });
  } catch (error) {
    console.error("❌ Error suspend user:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal suspend user" });
  }
};

export const unsuspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "User tidak ditemukan" });
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { 
        isSuspended: false,
        suspendedUntil: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isSuspended: true,
        suspendedUntil: true,
      },
    });

    console.log(`✅ User di-unsuspend - ID: ${id}`);
    res.json({ msg: "User berhasil di-unsuspend", user: updatedUser });
  } catch (error) {
    console.error("❌ Error unsuspend user:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal unsuspend user" });
  }
};

// Post Management (for admins to manage all posts)
export const getAllPostsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search, published, authorId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (published !== undefined) where.published = published === "true";
    if (authorId) where.authorId = authorId;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { excerpt: { contains: search as string, mode: "insensitive" } },
        { content: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              claps: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      db.post.count({ where }),
    ]);

    res.json({
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error mengambil semua posts (admin):", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil posts" });
  }
};

export const deletePostAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Post tidak ditemukan" });
    }

    await db.post.delete({ where: { id } });

    console.log(`✅ Post dihapus oleh admin - ID: ${id}`);
    res.json({ msg: "Post berhasil dihapus" });
  } catch (error) {
    console.error("❌ Error hapus post (admin):", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal menghapus post" });
  }
};

export const updatePostAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { published, title, excerpt } = req.body;

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Post tidak ditemukan" });
    }

    const updateData: any = {};
    if (published !== undefined) updateData.published = published;
    if (title) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;

    const updatedPost = await db.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ Post diupdate oleh admin - ID: ${id}`);
    res.json({ msg: "Post berhasil diupdate", post: updatedPost });
  } catch (error) {
    console.error("❌ Error update post (admin):", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengupdate post" });
  }
};

// Get maintenance mode status
export const getMaintenanceMode = async (req: AuthRequest, res: Response) => {
  try {
    let setting = await db.settings.findUnique({
      where: { key: "maintenance_mode" },
    });

    if (!setting) {
      // Create default setting if not exists
      setting = await db.settings.create({
        data: {
          key: "maintenance_mode",
          value: "false",
          description: "Maintenance mode status",
        },
      });
    }

    res.json({
      enabled: setting.value === "true",
      message: setting.description || null,
    });
  } catch (error: any) {
    console.error("❌ Error get maintenance mode:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil status maintenance mode",
      details: error.message,
    });
  }
};

// Toggle maintenance mode
export const toggleMaintenanceMode = async (req: AuthRequest, res: Response) => {
  try {
    const { enabled, message } = req.body;
    const userId = req.userId;

    if (typeof enabled !== "boolean") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "enabled harus boolean",
      });
    }

    let setting = await db.settings.findUnique({
      where: { key: "maintenance_mode" },
    });

    if (!setting) {
      setting = await db.settings.create({
        data: {
          key: "maintenance_mode",
          value: enabled ? "true" : "false",
          description: message || "Situs sedang dalam maintenance",
          updatedBy: userId || null,
        },
      });
    } else {
      setting = await db.settings.update({
        where: { key: "maintenance_mode" },
        data: {
          value: enabled ? "true" : "false",
          description: message || setting.description || "Situs sedang dalam maintenance",
          updatedBy: userId || null,
        },
      });
    }

    res.json({
      enabled: setting.value === "true",
      message: setting.description || null,
    });
  } catch (error: any) {
    console.error("❌ Error toggle maintenance mode:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal update maintenance mode",
      details: error.message,
    });
  }
};

