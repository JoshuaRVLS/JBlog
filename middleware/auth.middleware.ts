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
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isSuspended: true, suspendedUntil: true },
    });

    if (user?.isSuspended) {
      const now = new Date();
      const suspendedUntil = user.suspendedUntil;
      
      if (suspendedUntil && suspendedUntil < now) {
        await db.user.update({
          where: { id: userId },
          data: { isSuspended: false, suspendedUntil: null },
        });
      } else {
        const message = suspendedUntil
          ? `Akun Anda di-suspend hingga ${new Date(suspendedUntil).toLocaleString("id-ID")}. Silakan hubungi admin untuk informasi lebih lanjut.`
          : "Akun Anda telah di-suspend. Silakan hubungi admin untuk informasi lebih lanjut.";
        
        return res.status(StatusCodes.FORBIDDEN).json({ 
          msg: message,
          suspendedUntil: suspendedUntil || null
        });
      }
    }

    req.userId = userId;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token tidak valid atau sudah kadaluarsa" });
  }
};

