import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import { createNotification } from "./notifications.controller";

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
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
          },
          orderBy: { createdAt: "asc" },
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

export const getComments = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

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
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ comments });
  } catch (error) {
    console.error("❌ Error mengambil komentar:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil komentar" });
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

