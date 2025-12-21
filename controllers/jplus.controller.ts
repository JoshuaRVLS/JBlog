import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";

export const getJPlusStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Harus login dulu",
      });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        isJPlus: true,
        jPlusExpiresAt: true,
        jPlusTier: true,
        jPlusStartedAt: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "User tidak ditemukan",
      });
    }

    // Check if J+ is still active
    const isActive = user.isJPlus && (
      !user.jPlusExpiresAt || 
      new Date(user.jPlusExpiresAt) > new Date()
    );

    res.json({
      isJPlus: isActive,
      expiresAt: user.jPlusExpiresAt,
      tier: user.jPlusTier || "supporter",
      startedAt: user.jPlusStartedAt,
      daysRemaining: user.jPlusExpiresAt 
        ? Math.max(0, Math.ceil((new Date(user.jPlusExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
    });
  } catch (error: any) {
    console.error("Error getting J+ status:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil status J+",
      details: error.message,
    });
  }
};

export const upgradeToJPlus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { duration } = req.body; // duration in months (optional, default 1)

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Harus login dulu",
      });
    }

    // Only one tier: supporter
    const tier = "supporter";
    const months = duration || 1; // Default 1 month
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Update user J+ status
    const user = await db.user.update({
      where: { id: userId },
      data: {
        isJPlus: true,
        jPlusTier: tier,
        jPlusExpiresAt: expiresAt,
        jPlusStartedAt: new Date(),
      },
    });

    res.json({
      message: "J+ berhasil diaktifkan",
      jPlus: {
        isJPlus: true,
        tier: user.jPlusTier,
        expiresAt: user.jPlusExpiresAt,
        startedAt: user.jPlusStartedAt,
      },
    });
  } catch (error: any) {
    console.error("Error upgrading to J+:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengaktifkan J+",
      details: error.message,
    });
  }
};

export const cancelJPlus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Harus login dulu",
      });
    }

    await db.user.update({
      where: { id: userId },
      data: {
        isJPlus: false,
        jPlusExpiresAt: null,
        jPlusTier: null,
      },
    });

    res.json({
      message: "J+ berhasil dibatalkan",
    });
  } catch (error: any) {
    console.error("Error canceling J+:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal membatalkan J+",
      details: error.message,
    });
  }
};

