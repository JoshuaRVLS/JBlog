import { decrypt, encrypt, verify } from "../lib/jwt";
import { LoginSchema } from "../schemas/login.schema";
import type { Request, Response } from "express";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import bcrypt from "bcryptjs";

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

    const accessToken = await encrypt({ id: user.id }, "15m");

    const refreshToken = await encrypt({ id: user.id }, "7d");

    await db.refreshToken.upsert({
      create: {
        value: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      update: {
        value: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      where: {
        userId: user.id,
      },
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "prod",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "prod",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log(`✅ Login berhasil - User: ${user.email}`);
    res.status(StatusCodes.OK).json({ msg: "Login berhasil" });
  } catch (error) {
    console.error("❌ Error login:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal login, coba lagi nanti",
    });
  }
};
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await db.refreshToken.deleteMany({
        where: {
          value: refreshToken,
        },
      });
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    console.log("✅ Logout berhasil");
    res.json({ msg: "Logout berhasil" });
  } catch (error) {
    console.error("❌ Error logout:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Terjadi kesalahan saat logout" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    const storedRefreshToken = await db.refreshToken.findFirst({
      where: {
        value: refreshToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedRefreshToken) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Refresh token sudah kadaluarsa" });
    }

    if (refreshToken !== storedRefreshToken.value) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Refresh token tidak valid" });
    }

    const newAccessToken = await encrypt(
      { id: storedRefreshToken.userId },
      "15m"
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "prod",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    console.log("✅ Refresh token berhasil");
    res.json({ userId: storedRefreshToken.userId });
  } catch (error) {
    console.error("❌ Error refresh token:", error);
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
          "15m"
        );

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "prod",
          sameSite: "lax",
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
    console.error("❌ Error validasi token:", error);
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
          expiresAt: { gt: new Date() },
        },
      });

      if (storedRefreshToken) {
        const newAccessToken = await encrypt(
          { id: storedRefreshToken.userId },
          "15m"
        );

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "prod",
          sameSite: "lax",
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
    console.error("❌ Error getting socket token:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal mendapatkan token",
      token: null,
    });
  }
};
