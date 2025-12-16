import { Router } from "express";
import {
  createReport,
  getAllReports,
  getReport,
  updateReportStatus,
  deleteReport,
} from "../controllers/report.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

// Public route - anyone can create report
router.post("/", createReport);

// Admin routes - require authentication and admin access
router.get("/", requireAuth, requireAdmin, getAllReports);
router.get("/:id", requireAuth, requireAdmin, getReport);
router.put("/:id/status", requireAuth, requireAdmin, updateReportStatus);
router.delete("/:id", requireAuth, requireAdmin, deleteReport);

export default router;

