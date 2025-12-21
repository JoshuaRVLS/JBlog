import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import { createNotification } from "./notifications.controller";

export const toggleClap = async (req: AuthRequest, res: Response) => {
  try {
    const { postId: rawPostId } = req.params;
    const postId = String(rawPostId);
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }

    const existingClap = await db.clap.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingClap) {
      // Hapus clap
      await db.clap.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      console.log(`Clap dihapus - Post: ${postId}, User: ${userId}`);
      return res.json({ msg: "Clap dihapus", clapped: false });
    } else {
      // Tambah clap
      const clap = await db.clap.create({
        data: {
          postId,
          userId,
        },
        include: {
          post: {
            select: {
              authorId: true,
            },
          },
        },
      });
      console.log(`Clap ditambahkan - Post: ${postId}, User: ${userId}`);
      
      // Create notification untuk post author
      if (clap.post.authorId) {
        await createNotification({
          type: "like",
          userId: clap.post.authorId,
          actorId: userId,
          postId,
        });
      }
      
      return res.json({ msg: "Clap ditambahkan", clapped: true });
    }
  } catch (error) {
    console.error("Error toggle clap:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal toggle clap" });
  }
};

export const getClapsCount = async (req: AuthRequest, res: Response) => {
  try {
    const { postId: rawPostId } = req.params;
    const postId = String(rawPostId);
    const userId = req.userId;

    const [count, hasClapped] = await Promise.all([
      db.clap.count({ where: { postId } }),
      userId
        ? db.clap.findUnique({
            where: {
              postId_userId: {
                postId,
                userId,
              },
            },
          })
        : null,
    ]);

    res.json({
      count,
      hasClapped: !!hasClapped,
    });
  } catch (error) {
    console.error("Error mengambil jumlah clap:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil jumlah clap" });
  }
};

