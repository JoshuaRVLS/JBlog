import { Router } from "express";
import {
  repostPost,
  unrepostPost,
  getPostReposts,
  checkRepostStatus,
} from "../controllers/reposts.controller";
import { authenticate, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/:postId", requireAuth, repostPost);
router.delete("/:postId", requireAuth, unrepostPost);
router.get("/:postId", getPostReposts);
router.get("/:postId/status", authenticate, checkRepostStatus);

export default router;

