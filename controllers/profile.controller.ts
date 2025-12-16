import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";

// Update profile (hanya untuk user yang login)
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { name, bio, profilePicture, customLinks } = req.body;

    // Update user basic info
    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(profilePicture !== undefined && { profilePicture }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profilePicture: true,
        isVerified: true,
        createdAt: true,
        customLinks: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            label: true,
            url: true,
            order: true,
          },
        },
      },
    });

    // Update custom links if provided
    if (customLinks && Array.isArray(customLinks)) {
      // Delete existing links
      await db.customLink.deleteMany({
        where: { userId },
      });

      // Create new links
      if (customLinks.length > 0) {
        await db.customLink.createMany({
          data: customLinks.map((link: { label: string; url: string }, index: number) => ({
            userId,
            label: link.label,
            url: link.url,
            order: index,
          })),
        });
      }

      // Fetch updated user with links
      const updatedUser = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          profilePicture: true,
          isVerified: true,
          createdAt: true,
          customLinks: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              label: true,
              url: true,
              order: true,
            },
          },
        },
      });

      console.log(`✅ Profile diupdate - User: ${updatedUser?.email}`);
      return res.json({ msg: "Profile berhasil diupdate", user: updatedUser });
    }

    console.log(`✅ Profile diupdate - User: ${user.email}`);
    res.json({ msg: "Profile berhasil diupdate", user });
  } catch (error: any) {
    console.error("❌ Error update profile:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengupdate profile",
      details: error.message,
    });
  }
};

// Get current user profile
export const getCurrentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profilePicture: true,
        isVerified: true,
        isOwner: true,
        isAdmin: true,
        createdAt: true,
        customLinks: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            label: true,
            url: true,
            order: true,
          },
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User tidak ditemukan" });
    }

    res.json(user);
  } catch (error: any) {
    console.error("❌ Error get profile:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil profile",
      details: error.message,
    });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Password saat ini dan password baru diperlukan" });
    }

    if (newPassword.length < 6) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Password baru minimal 6 karakter" });
    }

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, email: true },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User tidak ditemukan" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Password saat ini salah" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    console.log(`✅ Password diubah - User: ${user.email}`);
    res.json({ msg: "Password berhasil diubah" });
  } catch (error: any) {
    console.error("❌ Error change password:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengubah password",
      details: error.message,
    });
  }
};

