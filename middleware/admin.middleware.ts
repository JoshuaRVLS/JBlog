import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }
    
    const user = await db.user.findUnique({ where: { id: req.userId } });
    if (!user?.isAdmin && !user?.isOwner) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: "Akses admin diperlukan" });
    }

    next();
  } catch (error) {
    console.error("❌ Error admin middleware:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal verifikasi akses admin" });
  }
};

