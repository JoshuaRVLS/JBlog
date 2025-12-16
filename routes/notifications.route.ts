import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notifications.controller";

const router = Router();

router.get("/", requireAuth, getNotifications);
router.get("/unread-count", requireAuth, getUnreadCount);
router.put("/all/read", requireAuth, markAllAsRead);
router.put("/:id/read", requireAuth, markAsRead);

export default router;

