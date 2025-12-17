import { Router } from "express";
import {
  getActiveBroadcast,
  getAllBroadcasts,
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
} from "../controllers/broadcast.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

router.get("/active", getActiveBroadcast);
router.get("/", requireAuth, requireAdmin, getAllBroadcasts);
router.post("/", requireAuth, requireAdmin, createBroadcast);
router.put("/:id", requireAuth, requireAdmin, updateBroadcast);
router.delete("/:id", requireAuth, requireAdmin, deleteBroadcast);

export default router;

