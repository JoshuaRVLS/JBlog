import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

export const getActiveBroadcast = async (req: any, res: Response) => {
  try {
    const broadcast = await db.broadcast.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!broadcast) {
      return res.json({ broadcast: null });
    }

    res.json({ broadcast });
  } catch (error) {
    console.error("Error fetching broadcast:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil broadcast",
    });
  }
};

export const getAllBroadcasts = async (req: AuthRequest, res: Response) => {
  try {
    const broadcasts = await db.broadcast.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({ broadcasts });
  } catch (error) {
    console.error("Error fetching broadcasts:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil broadcasts",
    });
  }
};

export const createBroadcast = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      message, 
      type, 
      theme, 
      icon, 
      backgroundColor, 
      textColor, 
      borderColor,
      particleEffect,
      particleEffectAfterCountdown,
      hasCountdown,
      countdownEndDate,
      actionAfterCountdown,
      messageAfterCountdown,
      redirectUrlAfterCountdown
    } = req.body;

    if (!title || !message) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Title dan message wajib diisi",
      });
    }

    await db.broadcast.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const broadcast = await db.broadcast.create({
      data: {
        title,
        message,
        type: type || "info",
        theme: theme || "default",
        icon,
        backgroundColor,
        textColor,
        borderColor,
        particleEffect: particleEffect || "none",
        particleEffectAfterCountdown: particleEffectAfterCountdown || null,
        hasCountdown: hasCountdown || false,
        countdownEndDate: countdownEndDate ? new Date(countdownEndDate) : null,
        actionAfterCountdown: actionAfterCountdown || null,
        messageAfterCountdown: messageAfterCountdown || null,
        redirectUrlAfterCountdown: redirectUrlAfterCountdown || null,
        isActive: true,
        createdBy: req.userId || "system",
      },
    });

    res.status(StatusCodes.CREATED).json({
      msg: "Broadcast berhasil dibuat",
      broadcast,
    });
  } catch (error) {
    console.error("Error creating broadcast:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal membuat broadcast",
    });
  }
};

export const updateBroadcast = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      message, 
      type, 
      theme, 
      icon, 
      backgroundColor, 
      textColor, 
      borderColor,
      particleEffect,
      particleEffectAfterCountdown,
      hasCountdown,
      countdownEndDate,
      actionAfterCountdown,
      messageAfterCountdown,
      redirectUrlAfterCountdown,
      isActive 
    } = req.body;

    const broadcast = await db.broadcast.findUnique({
      where: { id },
    });

    if (!broadcast) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "Broadcast tidak ditemukan",
      });
    }

    if (isActive) {
      await db.broadcast.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    const updated = await db.broadcast.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(message && { message }),
        ...(type && { type }),
        ...(theme !== undefined && { theme }),
        ...(icon !== undefined && { icon }),
        ...(backgroundColor !== undefined && { backgroundColor }),
        ...(textColor !== undefined && { textColor }),
        ...(borderColor !== undefined && { borderColor }),
        ...(particleEffect !== undefined && { particleEffect }),
        ...(particleEffectAfterCountdown !== undefined && { particleEffectAfterCountdown }),
        ...(hasCountdown !== undefined && { hasCountdown }),
        ...(countdownEndDate !== undefined && { countdownEndDate: countdownEndDate ? new Date(countdownEndDate) : null }),
        ...(actionAfterCountdown !== undefined && { actionAfterCountdown }),
        ...(messageAfterCountdown !== undefined && { messageAfterCountdown }),
        ...(redirectUrlAfterCountdown !== undefined && { redirectUrlAfterCountdown }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      msg: "Broadcast berhasil diupdate",
      broadcast: updated,
    });
  } catch (error) {
    console.error("Error updating broadcast:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal update broadcast",
    });
  }
};

export const deleteBroadcast = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await db.broadcast.delete({
      where: { id },
    });

    res.json({ msg: "Broadcast berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting broadcast:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal menghapus broadcast",
    });
  }
};

