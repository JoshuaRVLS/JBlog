import { Router } from "express";
import {
  sendDirectMessage,
  getConversation,
  getConversations,
  markMessagesAsRead,
  getUnreadCount,
} from "../controllers/directMessages.controller";
import { authenticate, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, sendDirectMessage);
router.get("/", requireAuth, getConversations);
router.get("/unread-count", authenticate, getUnreadCount);
router.get("/:userId", requireAuth, getConversation);
router.put("/:userId/read", requireAuth, markMessagesAsRead);

export default router;

