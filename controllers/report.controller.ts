import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

// Create report (anyone can report, authenticated or not)
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, type, pageUrl } = req.body;

    if (!title || !description) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Judul dan deskripsi harus diisi" });
    }

    const report = await db.report.create({
      data: {
        title,
        description,
        type: type || "bug",
        pageUrl: pageUrl || null,
        userId: req.userId || null, // Optional, bisa anonymous
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`Report dibuat - ID: ${report.id}, Type: ${report.type}`);
    res.status(StatusCodes.CREATED).json({
      msg: "Report berhasil dikirim. Terima kasih atas feedbacknya!",
      report,
    });
  } catch (error: any) {
    console.error("Error membuat report:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal membuat report",
      details: error.message,
    });
  }
};

// Get all reports (admin only)
export const getAllReports = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status, type, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      db.report.count({ where }),
    ]);

    res.json({
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Error mengambil reports:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil reports",
      details: error.message,
    });
  }
};

// Get single report (admin only)
export const getReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const report = await db.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Report tidak ditemukan" });
    }

    res.json(report);
  } catch (error: any) {
    console.error("Error mengambil report:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil report",
      details: error.message,
    });
  }
};

// Update report status (admin only)
export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "in_progress", "resolved", "closed"].includes(status)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Status tidak valid" });
    }

    const report = await db.report.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`Report status diupdate - ID: ${id}, Status: ${status}`);
    res.json({ msg: "Status report berhasil diupdate", report });
  } catch (error: any) {
    console.error("Error update report status:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengupdate status report",
      details: error.message,
    });
  }
};

// Delete report (admin only)
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await db.report.delete({ where: { id } });

    console.log(`Report dihapus - ID: ${id}`);
    res.json({ msg: "Report berhasil dihapus" });
  } catch (error: any) {
    console.error("Error hapus report:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal menghapus report",
      details: error.message,
    });
  }
};

