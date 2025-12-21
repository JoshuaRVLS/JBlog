import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { createNotification } from "./notifications.controller";

// Repost a post
export const repostPost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    if (!postId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "postId is required" });
    }

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Harus login dulu" });
    }

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Post tidak ditemukan" });
    }

    // Check if already reposted
    const existingRepost = await db.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingRepost) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Post sudah di-repost" });
    }

    const repost = await db.repost.create({
      data: {
        userId,
        postId,
      },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    // Create notification untuk post author
    if (repost.post.authorId) {
      await createNotification({
        type: "repost",
        userId: repost.post.authorId,
        actorId: userId,
        postId,
      });
    }

    console.log(`User ${userId} reposted post ${postId}`);
    res.json({
      message: "Post berhasil di-repost",
      repost,
    });
  } catch (error: any) {
    console.error("Error repost post:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal repost post",
      details: error.message,
    });
  }
};

// Unrepost a post
export const unrepostPost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    if (!postId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "postId is required" });
    }

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Harus login dulu" });
    }

    const repost = await db.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!repost) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Post belum di-repost" });
    }

    await db.repost.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    console.log(`User ${userId} unreposted post ${postId}`);
    res.json({ message: "Post berhasil di-unrepost" });
  } catch (error: any) {
    console.error("Error unrepost post:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal unrepost post",
      details: error.message,
    });
  }
};

// Get reposts for a post
export const getPostReposts = async (req: AuthRequest, res: Response) => {
  try {
    const { postId: rawPostId } = req.params;
    const postId = rawPostId ? String(rawPostId) : undefined;
    
    if (!postId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "postId is required" });
    }
    const page = parseInt((req.query?.page as string) || "1") || 1;
    const limit = parseInt((req.query?.limit as string) || "10") || 10;
    const skip = (page - 1) * limit;

    const [reposts, total] = await Promise.all([
      db.repost.findMany({
        where: { postId },
        include: {
          user: {
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
      db.repost.count({
        where: { postId },
      }),
    ]);

    res.json({
      reposts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error get post reposts:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil reposts",
      details: error.message,
    });
  }
};

// Check if post is reposted by user
export const checkRepostStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    if (!postId) {
      return res.json({ isReposted: false });
    }

    if (!userId) {
      return res.json({ isReposted: false });
    }

    const repost = await db.repost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    res.json({ isReposted: !!repost });
  } catch (error: any) {
    console.error("Error check repost status:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal cek repost status",
      details: error.message,
    });
  }
};

