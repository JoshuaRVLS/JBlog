import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import { BUCKETS, supabase } from "../lib/supabase";
import { getIO } from "../lib/socket";

// Get all group chats (public or user is member)
export const getAllGroupChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const where: any = {
      OR: [{ isPublic: true }],
    };

    // If authenticated, include groups where user is a member
    if (userId) {
      where.OR.push({
        members: {
          some: {
            userId,
          },
        },
      });
    }

    const groupChats = await db.groupChat.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ groupChats });
  } catch (error: any) {
    console.error("❌ Error mengambil group chats:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil group chats",
      details: error.message,
    });
  }
};

// Get single group chat
export const getGroupChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawId } = req.params;
    const id = String(rawId);
    const userId = req.userId;

    const groupChat = await db.groupChat.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Group chat tidak ditemukan" });
    }

    // Check if user is member or if group is public
    if (!groupChat.isPublic) {
      if (!userId) {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "Group chat ini private" });
      }

      const isMember = groupChat.members.some((m) => m.userId === userId);
      if (!isMember) {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "Kamu bukan member group ini" });
      }
    }

    res.json({ groupChat });
  } catch (error: any) {
    console.error("❌ Error mengambil group chat:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil group chat",
      details: error.message,
    });
  }
};

// Create group chat
export const createGroupChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { name, description, isPublic = true, banner } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Nama group chat harus diisi" });
    }

    const groupChat = await db.groupChat.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        banner: banner || null,
        isPublic: isPublic !== false,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: "admin",
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    console.log(`✅ Group chat dibuat - ID: ${groupChat.id}, Name: ${groupChat.name}`);
    res.status(StatusCodes.CREATED).json({
      msg: "Group chat berhasil dibuat",
      groupChat,
    });
  } catch (error: any) {
    console.error("❌ Error membuat group chat:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal membuat group chat",
      details: error.message,
    });
  }
};

// Join group chat
export const joinGroupChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { id: rawId } = req.params;
    const id = String(rawId);

    const groupChat = await db.groupChat.findUnique({
      where: { id },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Group chat tidak ditemukan" });
    }

    if (!groupChat.isPublic) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Group chat ini private" });
    }

    // Check if already a member
    const existingMember = await db.groupChatMember.findUnique({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId,
        },
      },
    });

    if (existingMember) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Sudah menjadi member" });
    }

    await db.groupChatMember.create({
      data: {
        groupChatId: id,
        userId,
        role: "member",
      },
    });

    console.log(`✅ User ${userId} join group chat ${id}`);
    res.json({ msg: "Berhasil join group chat" });
  } catch (error: any) {
    console.error("❌ Error join group chat:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal join group chat",
      details: error.message,
    });
  }
};

// Leave group chat
export const leaveGroupChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { id: rawId } = req.params;
    const id = String(rawId);

    const member = await db.groupChatMember.findUnique({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Kamu bukan member group ini" });
    }

    // Don't allow creator to leave
    const groupChat = await db.groupChat.findUnique({
      where: { id },
    });

    if (groupChat?.createdBy === userId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Creator tidak bisa leave group" });
    }

    await db.groupChatMember.delete({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId,
        },
      },
    });

    console.log(`✅ User ${userId} leave group chat ${id}`);
    res.json({ msg: "Berhasil leave group chat" });
  } catch (error: any) {
    console.error("❌ Error leave group chat:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal leave group chat",
      details: error.message,
    });
  }
};

// Get messages for a group chat
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawId } = req.params;
    const id = String(rawId);
    const { limit = 50, before } = req.query;
    const userId = req.userId;

    // Check if user has access
    const groupChat = await db.groupChat.findUnique({
      where: { id },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Group chat tidak ditemukan" });
    }

    if (!groupChat.isPublic) {
      if (!userId) {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "Harus login dulu" });
      }

      const isMember = await db.groupChatMember.findUnique({
        where: {
          groupChatId_userId: {
            groupChatId: id,
            userId: userId!,
          },
        },
      });

      if (!isMember) {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "Kamu bukan member group ini" });
      }
    }

    const where: any = { groupChatId: id };
    if (before) {
      where.createdAt = { lt: new Date(before as string) };
    }

    const messages = await db.message.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        reads: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(limit), 100),
    });

    // Reverse to show oldest first
    messages.reverse();

    res.json({ messages });
  } catch (error: any) {
    console.error("❌ Error mengambil messages:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil messages",
      details: error.message,
    });
  }
};

// Get members list
export const getMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawId } = req.params;
    const id = String(rawId);
    const userId = req.userId;

    // Check if user has access
    const groupChat = await db.groupChat.findUnique({
      where: { id },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Group chat tidak ditemukan" });
    }

    if (!groupChat.isPublic) {
      if (!userId) {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "Harus login dulu" });
      }

      const isMember = await db.groupChatMember.findUnique({
        where: {
          groupChatId_userId: {
            groupChatId: id,
            userId: userId!,
          },
        },
      });

      if (!isMember) {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "Kamu bukan member group ini" });
      }
    }

    const members = await db.groupChatMember.findMany({
      where: { groupChatId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            bio: true,
          },
        },
      },
      orderBy: [
        { role: "desc" }, // Admin first
        { joinedAt: "asc" }, // Then by join date
      ],
    });

    res.json({ members });
  } catch (error: any) {
    console.error("❌ Error mengambil members:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil members",
      details: error.message,
    });
  }
};

// Update group chat (admin only)
export const updateGroupChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawId } = req.params;
    const id = String(rawId);
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    // Check if user is admin or creator
    const member = await db.groupChatMember.findUnique({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId: userId!,
        },
      },
    });

    const groupChat = await db.groupChat.findUnique({
      where: { id },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Group chat tidak ditemukan" });
    }

    const isCreator = groupChat.createdBy === userId;
    const isAdmin = member?.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Hanya admin yang bisa update group chat" });
    }

    const { name, description, logo, banner } = req.body;
    const updateData: any = {};

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Nama group chat tidak boleh kosong" });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (logo !== undefined) {
      updateData.logo = logo || null;
    }

    if (banner !== undefined) {
      updateData.banner = banner || null;
    }

    const updatedGroupChat = await db.groupChat.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    console.log(`✅ Group chat diupdate - ID: ${id}`);
    res.json({ msg: "Group chat berhasil diupdate", groupChat: updatedGroupChat });
  } catch (error: any) {
    console.error("❌ Error update group chat:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal update group chat",
      details: error.message,
    });
  }
};

// Upload group chat logo
export const uploadGroupLogo = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawId } = req.params;
    const id = String(rawId);
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Tidak ada file yang diupload" });
    }

    // Check if user is admin or creator
    const member = await db.groupChatMember.findUnique({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId: userId!,
        },
      },
    });

    const groupChat = await db.groupChat.findUnique({
      where: { id },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Group chat tidak ditemukan" });
    }

    const isCreator = groupChat.createdBy === userId;
    const isAdmin = member?.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Hanya admin yang bisa upload logo" });
    }

    const file = req.file;
    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Tidak ada file yang diupload" });
    }
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${id}/logo-${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
    const filePath = fileName;

    // Delete old logo if exists
    if (groupChat.logo) {
      const oldLogoPath = groupChat.logo.split("/").slice(-2).join("/");
      await supabase.storage.from(BUCKETS.IMAGES).remove([oldLogoPath]);
    }

    const fileBuffer = file.buffer;
    if (!fileBuffer) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "File buffer tidak tersedia" });
    }

    const { data, error } = await supabase.storage
      .from(BUCKETS.IMAGES)
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("❌ Error upload logo ke Supabase:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Gagal upload logo ke storage",
        details: error.message,
      });
    }

    const { data: urlData } = supabase.storage.from(BUCKETS.IMAGES).getPublicUrl(filePath);

    // Update group chat with new logo
    const updatedGroupChat = await db.groupChat.update({
      where: { id },
      data: { logo: urlData.publicUrl },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    console.log(`✅ Logo group chat diupload - Group: ${id}`);
    res.json({
      msg: "Logo berhasil diupload",
      logo: urlData.publicUrl,
      groupChat: updatedGroupChat,
    });
  } catch (error: any) {
    console.error("❌ Error upload logo:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal upload logo",
      details: error.message,
    });
  }
};

// Upload group chat banner (wide image for explore)
export const uploadGroupBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawId } = req.params;
    const id = String(rawId);
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }

    const file = req.file;

    if (!file) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Tidak ada file yang diupload" });
    }

    // Check if user is admin or creator
    const member = await db.groupChatMember.findUnique({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId: userId!,
        },
      },
    });

    const groupChat = await db.groupChat.findUnique({
      where: { id },
    });

    if (!groupChat) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Group chat tidak ditemukan" });
    }

    const isCreator = groupChat.createdBy === userId;
    const isAdmin = member?.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: "Hanya admin yang bisa upload banner",
      });
    }

    const fileExt = file.originalname.split(".").pop();
    const fileName = `${id}/banner-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}.${fileExt}`;
    const filePath = fileName;

    // Delete old banner if exists
    if (groupChat.banner) {
      const oldBannerPath = groupChat.banner.split("/").slice(-2).join("/");
      await supabase.storage.from(BUCKETS.IMAGES).remove([oldBannerPath]);
    }

    const fileBuffer = file.buffer;
    if (!fileBuffer) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "File buffer tidak tersedia" });
    }

    const { data, error } = await supabase.storage
      .from(BUCKETS.IMAGES)
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("❌ Error upload banner ke Supabase:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Gagal upload banner ke storage",
        details: error.message,
      });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKETS.IMAGES)
      .getPublicUrl(filePath);

    // Update group chat with new banner
    const updatedGroupChat = await db.groupChat.update({
      where: { id },
      data: { banner: urlData.publicUrl },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    console.log(`✅ Banner group chat diupload - Group: ${id}`);
    res.json({
      msg: "Banner berhasil diupload",
      banner: urlData.publicUrl,
      groupChat: updatedGroupChat,
    });
  } catch (error: any) {
    console.error("❌ Error upload banner:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal upload banner",
      details: error.message,
    });
  }
};

// Promote member to admin (admin/creator only)
export const promoteMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawId, memberId: rawMemberId } = req.params;
    const id = String(rawId);
    const memberId = String(rawMemberId);
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    // Check if user is admin or creator
    const member = await db.groupChatMember.findUnique({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId: userId!,
        },
      },
    });

    const groupChat = await db.groupChat.findUnique({
      where: { id },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Group chat tidak ditemukan" });
    }

    const isCreator = groupChat.createdBy === userId;
    const isAdmin = member?.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Hanya admin yang bisa promote member" });
    }

    // Check if target member exists
    const targetMember = await db.groupChatMember.findUnique({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId: memberId!,
        },
      },
    });

    if (!targetMember) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Member tidak ditemukan" });
    }

    if (targetMember.role === "admin") {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Member sudah admin" });
    }

    await db.groupChatMember.update({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId: memberId!,
        },
      },
      data: { role: "admin" },
    });

    console.log(`✅ Member ${memberId} dipromote menjadi admin di group ${id}`);
    res.json({ msg: "Member berhasil dipromote menjadi admin" });
  } catch (error: any) {
    console.error("❌ Error promote member:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal promote member",
      details: error.message,
    });
  }
};

// Demote admin to member (creator only)
export const demoteMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawId, memberId: rawMemberId } = req.params;
    const id = String(rawId);
    const memberId = String(rawMemberId);
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    // Only creator can demote
    const groupChat = await db.groupChat.findUnique({
      where: { id },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Group chat tidak ditemukan" });
    }

    if (groupChat.createdBy !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Hanya creator yang bisa demote admin" });
    }

    // Can't demote creator
    if (groupChat.createdBy === memberId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Tidak bisa demote creator" });
    }

    // Check if target member exists
    const targetMember = await db.groupChatMember.findUnique({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId: memberId!,
        },
      },
    });

    if (!targetMember) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Member tidak ditemukan" });
    }

    if (targetMember.role === "member") {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Member sudah member" });
    }

    await db.groupChatMember.update({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId: memberId!,
        },
      },
      data: { role: "member" },
    });

    console.log(`✅ Admin ${memberId} didemote menjadi member di group ${id}`);
    res.json({ msg: "Admin berhasil didemote menjadi member" });
  } catch (error: any) {
    console.error("❌ Error demote member:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal demote member",
      details: error.message,
    });
  }
};

// Remove member from group (admin/creator only)
export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawId, memberId: rawMemberId } = req.params;
    const id = String(rawId);
    const memberId = String(rawMemberId);
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    // Check if user is admin or creator
    const member = await db.groupChatMember.findUnique({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId: userId!,
        },
      },
    });

    const groupChat = await db.groupChat.findUnique({
      where: { id },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Group chat tidak ditemukan" });
    }

    const isCreator = groupChat.createdBy === userId;
    const isAdmin = member?.role === "admin";

    if (!isCreator && !isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Hanya admin yang bisa remove member" });
    }

    // Can't remove creator
    if (groupChat.createdBy === memberId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Tidak bisa remove creator" });
    }

    // Check if target member exists
    const targetMember = await db.groupChatMember.findUnique({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId: memberId!,
        },
      },
    });

    if (!targetMember) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Member tidak ditemukan" });
    }

    await db.groupChatMember.delete({
      where: {
        groupChatId_userId: {
          groupChatId: id,
          userId: memberId!,
        },
      },
    });

    console.log(`✅ Member ${memberId} dihapus dari group ${id}`);
    res.json({ msg: "Member berhasil dihapus dari group" });
  } catch (error: any) {
    console.error("❌ Error remove member:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal remove member",
      details: error.message,
    });
  }
};

// Explore public group chats
export const exploreGroupChats = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20, offset = 0, search } = req.query;
    const userId = req.userId;

    const where: any = {
      isPublic: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Get group chats with member count using aggregation
    const groupChats = await db.groupChat.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: Number(limit) * 2, // Get more to sort by member count
      skip: Number(offset),
    });

    // Sort by member count manually (most members first)
    groupChats.sort((a, b) => {
      const aCount = a._count?.members || 0;
      const bCount = b._count?.members || 0;
      if (aCount !== bCount) {
        return bCount - aCount; // Descending
      }
      // If same member count, sort by updatedAt
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Take only the requested limit after sorting
    const sortedGroupChats = groupChats.slice(0, Number(limit));

    // Check if user is member of each group
    const groupChatsWithMembership = await Promise.all(
      sortedGroupChats.map(async (group) => {
        let isMember = false;
        if (userId) {
          const member = await db.groupChatMember.findUnique({
            where: {
              groupChatId_userId: {
                groupChatId: group.id,
                userId,
              },
            },
          });
          isMember = !!member;
        }
        return { ...group, isMember };
      })
    );

    res.json({ groupChats: groupChatsWithMembership });
  } catch (error: any) {
    console.error("❌ Error explore group chats:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal explore group chats",
      details: error.message,
    });
  }
};

// Mark message as read in group chat
export const markMessageAsRead = async (req: AuthRequest, res: Response) => {
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

    // Check if message exists and user has access
    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        groupChat: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!message) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Pesan tidak ditemukan" });
    }

    // Check if user is member of the group
    const isMember = message.groupChat.isPublic || message.groupChat.members.length > 0;
    if (!isMember) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ error: "Kamu bukan member group ini" });
    }

    // Check if already read
    const existingRead = await db.messageRead.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (!existingRead) {
      // Mark as read
      await db.messageRead.create({
        data: {
          messageId,
          userId,
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

      // Emit to group that message was read
      const io = getIO();
      if (io) {
        io.to(`group:${message.groupChatId}`).emit("messageRead", {
          messageId,
          userId,
          readAt: new Date(),
        });
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error mark message as read:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal menandai pesan sebagai sudah dibaca",
      details: error.message,
    });
  }
};

