import type { Request, Response, NextFunction } from "express";
import { verify } from "../lib/jwt";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      req.userId = undefined;
      return next();
    }

    const userId = await verify(accessToken);
    req.userId = userId;
    next();
  } catch (error) {
    req.userId = undefined;
    next();
  }
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return res.status(401).json({ msg: "Harus login dulu" });
    }

    const userId = await verify(accessToken);
    
    // Check if user is suspended
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isSuspended: true },
    });

    if (user?.isSuspended) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        msg: "Akun Anda telah di-suspend. Silakan hubungi admin untuk informasi lebih lanjut." 
      });
    }

    req.userId = userId;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token tidak valid atau sudah kadaluarsa" });
  }
};

