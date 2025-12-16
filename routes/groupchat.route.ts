import { Router } from "express";
import {
  getAllGroupChats,
  getGroupChat,
  createGroupChat,
  joinGroupChat,
  leaveGroupChat,
  getMessages,
  getMembers,
  updateGroupChat,
  uploadGroupLogo,
  promoteMember,
  demoteMember,
  removeMember,
  exploreGroupChats,
} from "../controllers/groupchat.controller";
import { authenticate, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getAllGroupChats);
router.get("/explore", authenticate, exploreGroupChats); // Public endpoint (optional auth)
router.get("/:id", authenticate, getGroupChat);
router.get("/:id/members", requireAuth, getMembers);
router.get("/:id/messages", authenticate, getMessages);
router.post("/", requireAuth, createGroupChat);
router.put("/:id", requireAuth, updateGroupChat);
router.post("/:id/join", requireAuth, joinGroupChat);
router.delete("/:id/leave", requireAuth, leaveGroupChat);
router.put("/:id/members/:memberId/promote", requireAuth, promoteMember);
router.put("/:id/members/:memberId/demote", requireAuth, demoteMember);
router.delete("/:id/members/:memberId", requireAuth, removeMember);

export default router;

