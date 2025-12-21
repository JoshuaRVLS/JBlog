import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";

// Bookmark a post
export const bookmarkPost = async (req: AuthRequest, res: Response) => {
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

    // Check if already bookmarked
    const existingBookmark = await db.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingBookmark) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Post sudah di-bookmark" });
    }

    const bookmark = await db.bookmark.create({
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
      },
    });

    console.log(`User ${userId} bookmarked post ${postId}`);
    res.json({
      message: "Post berhasil di-bookmark",
      bookmark,
    });
  } catch (error: any) {
    console.error("Error bookmark post:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal bookmark post",
      details: error.message,
    });
  }
};

// Unbookmark a post
export const unbookmarkPost = async (req: AuthRequest, res: Response) => {
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

    const bookmark = await db.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!bookmark) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Post belum di-bookmark" });
    }

    await db.bookmark.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    console.log(`User ${userId} unbookmarked post ${postId}`);
    res.json({ message: "Post berhasil di-unbookmark" });
  } catch (error: any) {
    console.error("Error unbookmark post:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal unbookmark post",
      details: error.message,
    });
  }
};

// Get user's bookmarked posts
export const getBookmarkedPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Harus login dulu" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      db.bookmark.findMany({
        where: { userId },
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
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.bookmark.count({
        where: { userId },
      }),
    ]);

    res.json({
      bookmarks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error get bookmarked posts:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil bookmarked posts",
      details: error.message,
    });
  }
};

// Check if post is bookmarked
export const checkBookmarkStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    if (!postId) {
      return res.json({ isBookmarked: false });
    }

    if (!userId) {
      return res.json({ isBookmarked: false });
    }

    const bookmark = await db.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    res.json({ isBookmarked: !!bookmark });
  } catch (error: any) {
    console.error("Error check bookmark status:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal cek bookmark status",
      details: error.message,
    });
  }
};

