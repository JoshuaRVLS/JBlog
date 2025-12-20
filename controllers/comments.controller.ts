import type { Response, Request } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import { createNotification } from "./notifications.controller";

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { postId: rawPostId } = req.params;
    const postId = String(rawPostId);
    const { content, parentId } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }

    const comment = await db.comment.create({
      data: {
        content,
        postId,
        userId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        post: {
          select: {
            authorId: true,
          },
        },
        parent: {
          select: {
            userId: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
            likes: {
              select: {
                userId: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    console.log(`✅ Komentar dibuat - Post: ${postId}, User: ${userId}`);
    
    // Create notifications
    if (parentId) {
      // Reply to comment - notify comment author
      if (comment.parent?.userId) {
        await createNotification({
          type: "reply",
          userId: comment.parent.userId,
          actorId: userId,
          postId,
          commentId: comment.id,
        });
      }
    } else {
      // Comment on post - notify post author
      if (comment.post.authorId) {
        await createNotification({
          type: "comment",
          userId: comment.post.authorId,
          actorId: userId,
          postId,
          commentId: comment.id,
        });
      }
    }
    
    res.status(StatusCodes.CREATED).json({ msg: "Komentar berhasil dibuat", comment });
  } catch (error) {
    console.error("❌ Error membuat komentar:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal membuat komentar" });
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const comments = await db.comment.findMany({
      where: {
        postId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
            likes: {
              select: {
                userId: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Attach derived flags for current user (liked)
    const enrichedComments = comments.map((comment) => {
      const hasLiked = userId
        ? comment.likes.some((like) => like.userId === userId)
        : false;

      const enrichedReplies = comment.replies.map((reply) => {
        const replyHasLiked = userId
          ? reply.likes.some((like) => like.userId === userId)
          : false;
        return {
          ...reply,
          hasLiked: replyHasLiked,
          likesCount: reply._count?.likes ?? 0,
        };
      });

      return {
        ...comment,
        hasLiked,
        likesCount: comment._count?.likes ?? 0,
        replies: enrichedReplies,
      };
    });

    res.json({ comments: enrichedComments });
  } catch (error) {
    console.error("❌ Error mengambil komentar:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil komentar" });
  }
};

export const toggleCommentLike = async (req: AuthRequest, res: Response) => {
  try {
    const { id: rawId } = req.params;
    const id = String(rawId);
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }

    const comment = await db.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!comment) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Komentar tidak ditemukan" });
    }

    const existingLike = await db.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: id,
          userId,
        },
      },
    });

    let liked: boolean;
    if (existingLike) {
      await db.commentLike.delete({
        where: { commentId_userId: { commentId: id, userId } },
      });
      liked = false;
    } else {
      await db.commentLike.create({
        data: {
          commentId: id,
          userId,
        },
      });
      liked = true;

      // Optional: create notification for comment like (avoid self-like notification)
      if (comment.userId !== userId) {
        await createNotification({
          type: "like",
          userId: comment.userId,
          actorId: userId,
          postId: comment.postId,
          commentId: comment.id,
        });
      }
    }

    const likesCount = await db.commentLike.count({
      where: { commentId: id },
    });

    res.json({
      msg: "Berhasil toggle like komentar",
      liked,
      likesCount,
    });
  } catch (error) {
    console.error("❌ Error toggle like komentar:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal toggle like komentar" });
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }

    const comment = await db.comment.findUnique({ where: { id } });
    if (!comment) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Komentar tidak ditemukan" });
    }

    if (comment.userId !== userId) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: "Kamu tidak punya akses untuk update komentar ini" });
    }

    const updatedComment = await db.comment.update({
      where: { id },
      data: { content },
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

    console.log(`✅ Komentar diupdate - ID: ${id}`);
    res.json({ msg: "Komentar berhasil diupdate", comment: updatedComment });
  } catch (error) {
    console.error("❌ Error update komentar:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengupdate komentar" });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Authentication required" });
    }

    const comment = await db.comment.findUnique({ where: { id } });
    if (!comment) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Comment not found" });
    }

    if (comment.userId !== userId) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: "Not authorized to delete this comment" });
    }

    await db.comment.delete({ where: { id } });

    res.json({ msg: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to delete comment" });
  }
};

