import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { RegisterSchema } from "../schemas/register.schema";
import bcrypt from "bcryptjs";
import { generateVerificationToken } from "../lib/generator";
import { encrypt } from "../lib/jwt";
import { getVerificationEmailTemplate } from "../lib/emailTemplate";

export const createUser = async (req: Request, res: Response) => {
  try {
    const result = await RegisterSchema.safeParseAsync(req.body);
    if (!result.success) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ errors: z.treeifyError(result.error) });
    }

    const { email, name, password } = result.data;
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());

    const user = await db.user.create({
      data: { email, name, password: hashedPassword },
    });

    const verificationCode = generateVerificationToken();
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY as string,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "JCorp", email: "jravaellnew@gmail.com" },
        to: [{ email: user.email, name: user.name }],
        subject: "JBlog - Kode Verifikasi Email Anda",
        htmlContent: getVerificationEmailTemplate(
          user.name,
          verificationCode,
          `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email/${user.id}?code=${verificationCode}`
        ),
      }),
    });

    await db.verificationCode.upsert({
      update: {
        value: verificationCode,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      create: {
        value: verificationCode,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userId: user.id,
      },
      where: {
        userId: user.id,
      },
    });

    // Don't auto-login, user needs to verify email first
    console.log(`✅ User berhasil dibuat - User: ${user.email}`);
    res.status(StatusCodes.CREATED).json({
      msg: "Registrasi berhasil! Silakan cek email kamu untuk kode verifikasi.",
      user: { id: user.id, email: user.email, name: user.name },
      redirectTo: `/verify-email/${user.id}`,
    });
  } catch (error: any) {
    // Handle unique constraint violation (email already exists)
    if (error.code === "P2002") {
      console.log(`⚠️ Email sudah terdaftar: ${req.body?.email || "unknown"}`);
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: "Email sudah terdaftar", error: "Email sudah terdaftar" });
    }
    
    console.error("❌ Error membuat user:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Gagal membuat user", error: "Gagal membuat user" });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await db.user.findUnique({
      where: { id },
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
        isOwner: true,
        isAdmin: true,
        isVerified: true,
        isSuspended: true,
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
      return res.status(StatusCodes.NOT_FOUND).json({ error: "User tidak ditemukan" });
    }

    res.json(user);
  } catch (error) {
    console.error("❌ Error mengambil user:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil user" });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, bio, profilePicture } = req.body;

    const user = await db.user.update({
      where: { id },
      data: {
        name,
        bio,
        profilePicture,
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profilePicture: true,
      },
    });

    res.json({ msg: "Profile berhasil diupdate", user });
  } catch (error) {
    console.error("❌ Error update profile:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengupdate profile" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "User tidak ditemukan" });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Password saat ini salah" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, await bcrypt.genSalt());
    await db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ msg: "Password berhasil diubah" });
  } catch (error) {
    console.error("❌ Error mengubah password:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengubah password" });
  }
};

export const changeEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newEmail } = req.body;

    const user = await db.user.update({
      where: { id },
      data: { email: newEmail },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    res.json({ msg: "Email berhasil diubah", user });
  } catch (error: any) {
    // Handle unique constraint violation (email already exists)
    if (error.code === "P2002") {
      console.log(`⚠️ Email sudah terdaftar: ${req.body?.newEmail || "unknown"}`);
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: "Email sudah terdaftar", error: "Email sudah terdaftar" });
    }
    
    console.error("❌ Error mengubah email:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Gagal mengubah email", error: "Gagal mengubah email" });
  }
};

// Get follow status between current user and target user
export const getUserActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    // Validate and parse days parameter
    const daysNum = Number(days);
    if (isNaN(daysNum) || daysNum < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: "Parameter days harus berupa angka positif" 
      });
    }
    
    const daysCount = Math.min(Math.max(daysNum, 1), 90); // Min 1, Max 90 days

    // Use the param id, or authenticated user's ID if param is not provided
    const targetUserId = id || req.userId;
    
    if (!targetUserId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        error: "User ID tidak ditemukan" 
      });
    }

    // Verify user exists
    const userExists = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!userExists) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: "User tidak ditemukan" 
      });
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate start date: daysCount days ago (including today, so daysCount - 1 days back)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (daysCount - 1));
    startDate.setHours(0, 0, 0, 0);

    // Get posts created by user
    const posts = await db.post.findMany({
      where: {
        authorId: targetUserId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Get comments made by user
    const comments = await db.comment.findMany({
      where: {
        userId: targetUserId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Get claps given by user
    const claps = await db.clap.findMany({
      where: {
        userId: targetUserId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    console.log(`📊 Activity for user ${targetUserId}:`, {
      posts: posts.length,
      comments: comments.length,
      claps: claps.length,
      days: daysCount,
    });

    // Group by date
    const activityMap = new Map<string, { date: string; posts: number; comments: number; claps: number }>();

    // Initialize all dates in range (from startDate to today, inclusive)
    // This gives us exactly daysCount days including today
    for (let i = 0; i < daysCount; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      if (dateStr) {
        activityMap.set(dateStr, { date: dateStr, posts: 0, comments: 0, claps: 0 });
      }
    }

    // Count posts per day
    posts.forEach((post) => {
      const dateStr = post.createdAt.toISOString().split("T")[0];
      if (dateStr) {
        const existing = activityMap.get(dateStr);
        if (existing) {
          existing.posts++;
        }
      }
    });

    // Count comments per day
    comments.forEach((comment) => {
      const dateStr = comment.createdAt.toISOString().split("T")[0];
      if (dateStr) {
        const existing = activityMap.get(dateStr);
        if (existing) {
          existing.comments++;
        }
      }
    });

    // Count claps per day
    claps.forEach((clap) => {
      const dateStr = clap.createdAt.toISOString().split("T")[0];
      if (dateStr) {
        const existing = activityMap.get(dateStr);
        if (existing) {
          existing.claps++;
        }
      }
    });

    // Convert to array and sort by date
    const activity = Array.from(activityMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    console.log(`📊 Activity response for user ${targetUserId}:`, {
      totalDays: activity.length,
      totalPosts: posts.length,
      totalComments: comments.length,
      totalClaps: claps.length,
      sampleData: activity.slice(0, 3),
      daysWithActivity: activity.filter(a => a.posts > 0 || a.comments > 0 || a.claps > 0).length,
    });

    res.json({ activity });
  } catch (error: any) {
    console.error("❌ Error mengambil activity:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      userId: req.userId,
      paramId: req.params.id,
    });
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ 
        error: "Gagal mengambil activity",
        msg: error.message || "Terjadi kesalahan saat mengambil data activity"
      });
  }
};

export const getFollowStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawTargetUserId } = req.params;
    const targetUserId = String(rawTargetUserId);
    const userId = req.userId;

    if (!userId) {
      return res.json({
        isFollowing: false,
        isFollowedBy: false,
        isFriend: false,
        shouldFollowBack: false,
      });
    }

    const [isFollowing, isFollowedBy] = await Promise.all([
      db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      }),
      db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: targetUserId,
            followingId: userId,
          },
        },
      }),
    ]);

    const following = !!isFollowing;
    const followedBy = !!isFollowedBy;
    const isFriend = following && followedBy;
    const shouldFollowBack = followedBy && !following;

    res.json({
      isFollowing: following,
      isFollowedBy: followedBy,
      isFriend,
      shouldFollowBack,
    });
  } catch (error: any) {
    console.error("❌ Error get follow status:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil follow status",
      details: error.message,
    });
  }
};

export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawTargetUserId } = req.params;
    const targetUserId = String(rawTargetUserId);
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }

    if (userId === targetUserId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Tidak bisa follow diri sendiri" });
    }

    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Sudah follow user ini" });
    }

    const follow = await db.follow.create({
      data: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    // Check if they are now friends (mutual follow)
    const reverseFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUserId,
          followingId: userId,
        },
      },
    });

    const isFriend = !!reverseFollow;

    console.log(`✅ User ${userId} follow user ${targetUserId}${isFriend ? " (now friends!)" : ""}`);
    res.json({
      msg: isFriend ? "Berhasil follow! Sekarang kalian sudah berteman!" : "Berhasil follow user",
      follow,
      isFriend,
    });
  } catch (error: any) {
    console.error("❌ Error follow user:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal follow user",
      details: error.message,
    });
  }
};

export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawTargetUserId } = req.params;
    const targetUserId = String(rawTargetUserId);
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }

    await db.follow.delete({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    console.log(`✅ User ${userId} unfollow user ${targetUserId}`);
    res.json({ msg: "Berhasil unfollow user" });
  } catch (error: any) {
    console.error("❌ Error unfollow user:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal unfollow user",
      details: error.message,
    });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sort = "recent" } = req.query; // recent, name

    let orderBy: any = { createdAt: "desc" };
    if (sort === "name") {
      orderBy = { follower: { name: "asc" } };
    }

    const followers = await db.follow.findMany({
      where: { followingId: id },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            bio: true,
          },
        },
      },
      orderBy,
    });

    res.json(followers);
  } catch (error) {
    console.error("Get followers error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to get followers" });
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sort = "recent" } = req.query; // recent, name

    let orderBy: any = { createdAt: "desc" };
    if (sort === "name") {
      orderBy = { following: { name: "asc" } };
    }

    const following = await db.follow.findMany({
      where: { followerId: id },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            bio: true,
          },
        },
      },
      orderBy,
    });

    res.json(following);
  } catch (error) {
    console.error("Get following error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to get following" });
  }
};

export const getUserLocations = async (req: Request, res: Response) => {
  try {
    const users = await db.user.findMany({
      where: {
        country: {
          not: null,
        },
      },
      select: {
        country: true,
      },
    });

    const locationCounts = new Map<string, number>();
    
    users.forEach((user) => {
      if (user.country) {
        const count = locationCounts.get(user.country) || 0;
        locationCounts.set(user.country, count + 1);
      }
    });

    const locations = Array.from(locationCounts.entries()).map(([country, count]) => ({
      country,
      count,
    }));

    const totalUsers = users.length;

    res.json({
      locations,
      totalUsers,
    });
  } catch (error) {
    console.error("❌ Error mengambil user locations:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil user locations" });
  }
};
