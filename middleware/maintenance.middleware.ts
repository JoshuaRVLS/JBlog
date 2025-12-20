import type { Request, Response, NextFunction } from "express";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

export const checkMaintenanceMode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip maintenance check for admin routes, auth routes, and maintenance status check
    if (
      req.path.startsWith("/api/admin") ||
      req.path.startsWith("/api/auth/login") ||
      req.path.startsWith("/api/auth/validate") ||
      req.path === "/api/admin/maintenance"
    ) {
      return next();
    }

    const setting = await db.settings.findUnique({
      where: { key: "maintenance_mode" },
    });

    if (setting && setting.value === "true") {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        error: "Maintenance Mode",
        message: setting.description || "Situs sedang dalam maintenance. Silakan coba lagi nanti.",
        maintenance: true,
      });
    }

    next();
  } catch (error) {
    // If error checking maintenance, allow request to proceed
    console.error("Error checking maintenance mode:", error);
    next();
  }
};

