import { Router } from "express";
import {
  getUpdateLogs,
  syncFromGitHub,
  createUpdateLog,
  deleteUpdateLog,
  webhookSync,
} from "../controllers/updatelog.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

router.get("/", getUpdateLogs);
router.post("/sync", requireAuth, requireAdmin, syncFromGitHub);
router.post("/webhook", webhookSync); // Public endpoint for GitHub webhook
router.post("/", requireAuth, requireAdmin, createUpdateLog);
router.delete("/:id", requireAuth, requireAdmin, deleteUpdateLog);

export default router;

