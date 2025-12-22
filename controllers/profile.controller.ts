import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import { generateVerificationToken } from "../lib/generator";
import { getVerificationEmailTemplate } from "../lib/emailTemplate";
import { getEmailSender } from "../lib/emailSender";

// Update profile (hanya untuk user yang login)
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { name, bio, profilePicture, country, website, location, twitter, github, linkedin, instagram, customLinks, customCSS } = req.body;

    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(profilePicture !== undefined && { profilePicture }),
        ...(country !== undefined && { country }),
        ...(website !== undefined && { website }),
        ...(location !== undefined && { location }),
        ...(twitter !== undefined && { twitter }),
        ...(github !== undefined && { github }),
        ...(linkedin !== undefined && { linkedin }),
        ...(instagram !== undefined && { instagram }),
        ...(customCSS !== undefined && { customCSS: customCSS && customCSS.trim() ? customCSS.trim() : null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profilePicture: true,
        country: true,
        website: true,
        location: true,
        twitter: true,
        github: true,
        linkedin: true,
        instagram: true,
        customCSS: true,
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
          country: true,
          website: true,
          location: true,
          twitter: true,
          github: true,
          linkedin: true,
          instagram: true,
          customCSS: true,
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

      console.log(`Profile diupdate - User: ${updatedUser?.email}`);
      return res.json({ msg: "Profile berhasil diupdate", user: updatedUser });
    }

    console.log(`Profile diupdate - User: ${user.email}`);
    res.json({ msg: "Profile berhasil diupdate", user });
  } catch (error: any) {
    console.error("Error update profile:", error);
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

    console.log(`🔍 Fetching profile for userId: ${userId}`);
    
    let user;
    try {
      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          profilePicture: true,
          country: true,
          website: true,
          location: true,
          twitter: true,
          github: true,
          linkedin: true,
          instagram: true,
          isVerified: true,
          isOwner: true,
          isAdmin: true,
          isJPlus: true,
          jPlusExpiresAt: true,
          jPlusTier: true,
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
      console.log(`User found: ${user ? user.email : "NOT FOUND"}`);
    } catch (queryError: any) {
      console.error("Prisma query error:", queryError);
      throw queryError;
    }

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User tidak ditemukan" });
    }

    try {
      const responseData = {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio ?? null,
        profilePicture: user.profilePicture ?? null,
        country: user.country ?? null,
        website: user.website ?? null,
        location: user.location ?? null,
        twitter: user.twitter ?? null,
        github: user.github ?? null,
        linkedin: user.linkedin ?? null,
        instagram: user.instagram ?? null,
        customCSS: user.customCSS ?? null,
        isVerified: user.isVerified ?? false,
        isOwner: user.isOwner ?? false,
        isAdmin: user.isAdmin ?? false,
        isJPlus: user.isJPlus ?? false,
        jPlusExpiresAt: user.jPlusExpiresAt ?? null,
        jPlusTier: user.jPlusTier ?? null,
        createdAt: user.createdAt,
        customLinks: Array.isArray(user.customLinks) ? user.customLinks : [],
        _count: {
          posts: user._count?.posts ?? 0,
          followers: user._count?.followers ?? 0,
          following: user._count?.following ?? 0,
        },
      };

      res.json(responseData);
    } catch (serializeError: any) {
      console.error("Error serializing response:", serializeError);
      throw serializeError;
    }
  } catch (error: any) {
    console.error("Error get profile:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    
    if (error.code === "P2002") {
      return res.status(StatusCodes.CONFLICT).json({
        error: "Konflik data",
        msg: "Terjadi konflik saat mengambil data",
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil profile",
      msg: error.message || "Terjadi kesalahan saat mengambil data profile",
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

    console.log(`Password diubah - User: ${user.email}`);
    res.json({ msg: "Password berhasil diubah" });
  } catch (error: any) {
    console.error("Error change password:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengubah password",
      details: error.message,
    });
  }
};

// Request email change - sends verification code to new email
export const requestEmailChange = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Email baru dan password diperlukan" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Format email tidak valid" });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true, name: true },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User tidak ditemukan" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Password salah" });
    }

    if (user.email === newEmail) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Email baru sama dengan email saat ini" });
    }

    // Check if email already exists
    const emailExists = await db.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });

    if (emailExists) {
      return res.status(StatusCodes.CONFLICT).json({ msg: "Email sudah terdaftar" });
    }

    // Generate verification code
    const verificationCode = generateVerificationToken();

    // Delete any existing email change verification for this user and email
    await db.emailChangeVerification.deleteMany({
      where: {
        userId: userId,
        newEmail: newEmail,
      },
    });

    // Create new email change verification
    await db.emailChangeVerification.create({
      data: {
        code: verificationCode,
        userId: userId,
        newEmail: newEmail,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email to new email address
    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY as string,
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: getEmailSender(),
          to: [
            {
              email: newEmail,
              name: user.name,
            },
          ],
          subject: "JBlog - Kode Verifikasi Perubahan Email",
          htmlContent: getVerificationEmailTemplate(
            user.name,
            verificationCode,
            `${process.env.FRONTEND_URL || "http://localhost:3000"}/profile/settings?tab=account&verifyEmail=true`
          ),
        }),
      });

      console.log(`Kode verifikasi email change dikirim - User: ${user.email} -> ${newEmail}`);
      res.json({ msg: "Kode verifikasi telah dikirim ke email baru Anda" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        msg: "Gagal mengirim email, tetapi kode telah dibuat. Silakan coba lagi nanti.",
      });
    }
  } catch (error: any) {
    console.error("Error request email change:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal memproses permintaan perubahan email",
      details: error.message,
    });
  }
};

// Verify email change - verifies code and changes email
export const verifyEmailChange = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { code } = req.body;

    if (!code) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Kode verifikasi diperlukan" });
    }

    // Find email change verification
    const emailChangeVerification = await db.emailChangeVerification.findFirst({
      where: {
        userId: userId,
        code: code,
        expiresAt: { gt: new Date() },
      },
    });

    if (!emailChangeVerification) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Kode tidak valid atau sudah kedaluwarsa" });
    }

    // Check if new email already exists
    const emailExists = await db.user.findUnique({
      where: { email: emailChangeVerification.newEmail },
      select: { id: true },
    });

    if (emailExists) {
      // Delete the verification code
      await db.emailChangeVerification.delete({
        where: { id: emailChangeVerification.id },
      });
      return res.status(StatusCodes.CONFLICT).json({ msg: "Email sudah terdaftar" });
    }

    // Get current user email for logging
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // Update email
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { email: emailChangeVerification.newEmail },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Delete the verification code
    await db.emailChangeVerification.delete({
      where: { id: emailChangeVerification.id },
    });

    // Delete any other pending email change verifications for this user
    await db.emailChangeVerification.deleteMany({
      where: { userId: userId },
    });

    console.log(`Email diubah - User: ${user?.email} -> ${emailChangeVerification.newEmail}`);
    res.json({ msg: "Email berhasil diubah", user: updatedUser });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(StatusCodes.CONFLICT).json({ msg: "Email sudah terdaftar" });
    }
    console.error("Error verify email change:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengubah email",
      details: error.message,
    });
  }
};

// Change country
export const changeCountry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { country } = req.body;

    const user = await db.user.update({
      where: { id: userId },
      data: { country: country || null },
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
      },
    });

    console.log(`Country diubah - User: ${user.email} -> ${country || "null"}`);
    res.json({ msg: "Negara berhasil diubah", user });
  } catch (error: any) {
    console.error("Error change country:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengubah negara",
      details: error.message,
    });
  }
};

// Delete own account
export const deleteOwnAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Password diperlukan untuk menghapus akun" });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true, isOwner: true },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User tidak ditemukan" });
    }

    if (user.isOwner) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Tidak bisa menghapus akun owner" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Password salah" });
    }

    await db.user.delete({ where: { id: userId } });

    console.log(`Akun dihapus - User: ${user.email}`);
    res.json({ msg: "Akun berhasil dihapus" });
  } catch (error: any) {
    console.error("Error delete account:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal menghapus akun",
      details: error.message,
    });
  }
};

