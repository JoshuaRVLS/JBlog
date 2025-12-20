import type { Request, Response, NextFunction } from "express";
import { verify } from "../lib/jwt";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

export interface AuthRequest extends Omit<Request, 'file' | 'files'> {
  userId?: string;
  file?: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
  };
  files?: { [fieldname: string]: Array<{
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
  }> } | Array<{
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
  }>;
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
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        msg: "Harus login dulu",
        code: "NO_TOKEN"
      });
    }

    let userId: string;
    try {
      userId = await verify(accessToken);
    } catch (error: any) {
      // More specific error messages
      if (error.message?.includes("expired")) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ 
          msg: "Token sudah kadaluarsa. Silakan refresh token atau login ulang.",
          code: "TOKEN_EXPIRED"
        });
      }
      
      if (error.message?.includes("Invalid")) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ 
          msg: "Token tidak valid",
          code: "INVALID_TOKEN"
        });
      }
      
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        msg: "Token tidak valid atau sudah kadaluarsa",
        code: "TOKEN_ERROR"
      });
    }
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isSuspended: true, suspendedUntil: true },
    });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        msg: "User tidak ditemukan",
        code: "USER_NOT_FOUND"
      });
    }

    if (user.isSuspended) {
      const now = new Date();
      const suspendedUntil = user.suspendedUntil;
      
      if (suspendedUntil && suspendedUntil < now) {
        // Auto-unsuspend if suspension period has passed
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
          code: "ACCOUNT_SUSPENDED",
          suspendedUntil: suspendedUntil || null
        });
      }
    }

    req.userId = userId;
    next();
  } catch (error: any) {
    console.error("❌ Error in requireAuth middleware:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: "Terjadi kesalahan saat autentikasi",
      code: "AUTH_ERROR"
    });
  }
};

