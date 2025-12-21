import { encrypt, verify, generateTokenId } from "../lib/jwt";
import { LoginSchema } from "../schemas/login.schema";
import type { Request, Response } from "express";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import bcrypt from "bcryptjs";

/**
 * Get client device information for security tracking
 */
const getDeviceInfo = (req: Request): string => {
  const userAgent = req.headers["user-agent"] || "Unknown";
  return userAgent.substring(0, 200); // Limit length
};

/**
 * Get client IP address
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "Unknown";
};

/**
 * Get secure cookie options
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
  
  return {
    httpOnly: true,
    secure: isProduction, // Only send over HTTPS in production
    sameSite: "lax" as const,
    path: "/",
    // domain: process.env.COOKIE_DOMAIN, // Uncomment if using custom domain
  };
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await LoginSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ errors: z.treeifyError(result.error), msg: "Login Gagal" });
    }

    const { email, password } = result.data;

    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    // Cek apakah user ada dan password benar
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Email atau password salah" });
    }

    // Cek apakah email sudah terverifikasi
    if (!user.isVerified) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ 
          msg: "Email belum terverifikasi. Silakan cek email kamu untuk kode verifikasi.",
          userId: user.id,
          requiresVerification: true
        });
    }

    // Generate tokens with unique IDs for tracking
    const refreshTokenId = generateTokenId();
    const accessToken = await encrypt({ id: user.id }, "15m", generateTokenId());
    const refreshToken = await encrypt({ id: user.id }, "7d", refreshTokenId);

    // Store refresh token with device info for security
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = getClientIp(req);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newRefreshTokenRecord = await db.refreshToken.create({
      data: {
        value: refreshToken,
        userId: user.id,
        expiresAt,
        deviceInfo,
        ipAddress,
        isRevoked: false,
      },
    });

    // Revoke old refresh tokens (keep last 5 tokens for multi-device support)
    const oldTokens = await db.refreshToken.findMany({
      where: {
        userId: user.id,
        isRevoked: false,
        id: { not: newRefreshTokenRecord.id },
      },
      orderBy: { createdAt: "desc" },
      skip: 4, // Keep last 5 tokens (including new one)
    });

    if (oldTokens.length > 0) {
      await db.refreshToken.updateMany({
        where: {
          id: { in: oldTokens.map(t => t.id) },
        },
        data: { isRevoked: true },
      });
    }

    const cookieOptions = getCookieOptions();

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    console.log(`Login berhasil - User: ${user.email}`);
    res.status(StatusCodes.OK).json({ msg: "Login berhasil" });
  } catch (error) {
    console.error("Error login:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal login, coba lagi nanti",
    });
  }
};
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Revoke refresh token instead of deleting (for audit trail)
      await db.refreshToken.updateMany({
        where: {
          value: refreshToken,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
        },
      });
    }

    const cookieOptions = getCookieOptions();

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    console.log("Logout berhasil");
    res.json({ msg: "Logout berhasil" });
  } catch (error) {
    console.error("Error logout:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Terjadi kesalahan saat logout" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: refreshTokenValue } = req.cookies;

    if (!refreshTokenValue) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Refresh token tidak ditemukan" });
    }

    // Verify token format first
    let userId: string;
    try {
      userId = await verify(refreshTokenValue);
    } catch (error: any) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Refresh token tidak valid atau sudah kadaluarsa" });
    }

    // Check if token exists in database and is not revoked
    const storedRefreshToken = await db.refreshToken.findFirst({
      where: {
        value: refreshTokenValue,
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedRefreshToken) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Refresh token tidak ditemukan atau sudah dicabut" });
    }

    // Optional: Implement refresh token rotation for better security
    // Rotate refresh token (generate new one, revoke old one)
    const shouldRotate = process.env.REFRESH_TOKEN_ROTATION === "true";
    
    let newRefreshToken = refreshTokenValue;
    
    if (shouldRotate) {
      // Generate new refresh token
      const newRefreshTokenId = generateTokenId();
      newRefreshToken = await encrypt({ id: userId }, "7d", newRefreshTokenId);
      
      // Revoke old token
      await db.refreshToken.update({
        where: { id: storedRefreshToken.id },
        data: { isRevoked: true },
      });
      
      // Create new refresh token
      const deviceInfo = getDeviceInfo(req);
      const ipAddress = getClientIp(req);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await db.refreshToken.create({
        data: {
          value: newRefreshToken,
          userId,
          expiresAt,
          deviceInfo,
          ipAddress,
          isRevoked: false,
        },
      });
    }

    // Generate new access token
    const newAccessToken = await encrypt({ id: userId }, "15m", generateTokenId());

    const cookieOptions = getCookieOptions();

    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    if (shouldRotate) {
      res.cookie("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    console.log("Refresh token berhasil");
    res.json({ userId });
  } catch (error: any) {
    console.error("Error refresh token:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Terjadi kesalahan saat refresh token" });
  }
};

export const validate = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = req.cookies;

    if (!accessToken && !refreshToken) {
      return res.json({ userId: null, authenticated: false });
    }

    if (accessToken) {
      try {
        const userId = await verify(accessToken);
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { isSuspended: true, suspendedUntil: true },
        });

        if (user?.isSuspended) {
          const now = new Date();
          if (user.suspendedUntil && user.suspendedUntil < now) {
            await db.user.update({
              where: { id: userId },
              data: { isSuspended: false, suspendedUntil: null },
            });
            return res.json({ userId, authenticated: true, isSuspended: false });
          }
          return res.json({ 
            userId, 
            authenticated: false, 
            isSuspended: true,
            suspendedUntil: user.suspendedUntil 
          });
        }

        return res.json({ userId, authenticated: true, isSuspended: false });
      } catch (error) {
      }
    }

    // Try to refresh using refresh token
    if (refreshToken) {
      const storedRefreshToken = await db.refreshToken.findFirst({
        where: {
          value: refreshToken,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (storedRefreshToken) {
        const user = await db.user.findUnique({
          where: { id: storedRefreshToken.userId },
          select: { isSuspended: true, suspendedUntil: true },
        });

        if (user?.isSuspended) {
          const now = new Date();
          if (user.suspendedUntil && user.suspendedUntil < now) {
            await db.user.update({
              where: { id: storedRefreshToken.userId },
              data: { isSuspended: false, suspendedUntil: null },
            });
          } else {
            return res.json({
              userId: storedRefreshToken.userId,
              authenticated: false,
              isSuspended: true,
              suspendedUntil: user.suspendedUntil,
            });
          }
        }

        const newAccessToken = await encrypt(
          { id: storedRefreshToken.userId },
          "15m",
          generateTokenId()
        );

        const cookieOptions = getCookieOptions();

        res.cookie("accessToken", newAccessToken, {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000,
        });

        return res.json({
          userId: storedRefreshToken.userId,
          authenticated: true,
          isSuspended: false,
        });
      }
    }

    return res.json({ userId: null, authenticated: false });
  } catch (error) {
    console.error("Error validasi token:", error);
    return res.json({ userId: null, authenticated: false });
  }
};

// Get token for socket.io connection
export const getSocketToken = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = req.cookies;

    if (!accessToken && !refreshToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        msg: "Token tidak ditemukan, silakan login ulang",
        token: null 
      });
    }

    // Try to validate access token first
    if (accessToken) {
      try {
        const userId = await verify(accessToken);
        return res.json({ 
          token: accessToken,
          userId,
          authenticated: true 
        });
      } catch (error) {
        // Access token invalid, try refresh token
      }
    }

    // Try to refresh using refresh token
    if (refreshToken) {
      const storedRefreshToken = await db.refreshToken.findFirst({
        where: {
          value: refreshToken,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (storedRefreshToken) {
        const newAccessToken = await encrypt(
          { id: storedRefreshToken.userId },
          "15m",
          generateTokenId()
        );

        const cookieOptions = getCookieOptions();

        res.cookie("accessToken", newAccessToken, {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000,
        });

        return res.json({
          token: newAccessToken,
          userId: storedRefreshToken.userId,
          authenticated: true,
        });
      }
    }

    return res.status(StatusCodes.UNAUTHORIZED).json({ 
      msg: "Token tidak ditemukan, silakan login ulang",
      token: null 
    });
  } catch (error) {
    console.error("Error getting socket token:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal mendapatkan token",
      token: null,
    });
  }
};
