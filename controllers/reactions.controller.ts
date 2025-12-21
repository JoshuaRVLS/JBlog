import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";

const REACTION_TYPES = ["like", "love", "laugh", "wow", "sad", "angry"] as const;
type ReactionType = typeof REACTION_TYPES[number];

// Add or update reaction to a post
export const addReaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { postId } = req.params;
    const { type } = req.body;

    if (!postId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "postId is required" });
    }

    if (!REACTION_TYPES.includes(type)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: `Invalid reaction type. Must be one of: ${REACTION_TYPES.join(", ")}` 
      });
    }

    // Check if post exists
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Post tidak ditemukan" });
    }

    // Upsert reaction (create or update if exists)
    const reaction = await db.reaction.upsert({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
      create: {
        postId,
        userId,
        type,
      },
      update: {
        type,
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

    // Get reaction counts for this post
    const reactionCounts = await db.reaction.groupBy({
      by: ["type"],
      where: { postId },
      _count: true,
    });

    // Build counts object
    const counts: Record<string, number> = {};
    reactionCounts.forEach((item) => {
      counts[item.type] = item._count;
    });

    res.status(StatusCodes.OK).json({
      reaction,
      counts,
    });
  } catch (error: any) {
    console.error("Error adding reaction:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal menambahkan reaction",
      error: error.message,
    });
  }
};

// Remove reaction from a post
export const removeReaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { postId } = req.params;

    if (!postId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "postId is required" });
    }

    await db.reaction.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    // Get updated reaction counts
    const reactionCounts = await db.reaction.groupBy({
      by: ["type"],
      where: { postId },
      _count: true,
    });

    // Build counts object
    const counts: Record<string, number> = {};
    reactionCounts.forEach((item) => {
      counts[item.type] = item._count;
    });

    res.status(StatusCodes.OK).json({
      msg: "Reaction dihapus",
      counts,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Reaction tidak ditemukan" });
    }
    console.error("Error removing reaction:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal menghapus reaction",
      error: error.message,
    });
  }
};

// Get reactions for a post (public endpoint, optional auth)
export const getPostReactions = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId; // Bisa undefined jika tidak login

    if (!postId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "postId is required" });
    }

    // Get all reactions with user info
    const reactions = await db.reaction.findMany({
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
    });

    // Get reaction counts grouped by type
    const reactionCounts = await db.reaction.groupBy({
      by: ["type"],
      where: { postId },
      _count: true,
    });

    // Build counts object
    const counts: Record<string, number> = {};
    reactionCounts.forEach((item) => {
      counts[item.type] = item._count;
    });

    // Get user's reaction if logged in
    let userReaction = null;
    if (userId) {
      userReaction = await db.reaction.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
    }

    res.status(StatusCodes.OK).json({
      reactions,
      counts,
      userReaction: userReaction?.type || null,
    });
  } catch (error: any) {
    console.error("Error getting reactions:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal mengambil reactions",
      error: error.message,
    });
  }
};

