import { Router } from "express";
import {
  bookmarkPost,
  unbookmarkPost,
  getBookmarkedPosts,
  checkBookmarkStatus,
} from "../controllers/bookmarks.controller";
import { authenticate, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/:postId", requireAuth, bookmarkPost);
router.delete("/:postId", requireAuth, unbookmarkPost);
router.get("/", requireAuth, getBookmarkedPosts);
router.get("/:postId/status", authenticate, checkBookmarkStatus);

export default router;

