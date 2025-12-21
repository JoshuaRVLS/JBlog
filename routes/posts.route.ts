import { Router } from "express";
import {
  createPost,
  updatePost,
  deletePost,
  getPost,
  getPublicPost,
  getAllPosts,
  getTotalViews,
  getPostVersions,
  restorePostVersion,
  getUserDrafts,
  getScheduledPosts,
  trackPostView,
} from "../controllers/posts.controller";
import { authenticate, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, createPost);
router.get("/", getAllPosts);
router.get("/total-views", getTotalViews); // Public endpoint
router.get("/drafts", requireAuth, getUserDrafts);
router.get("/scheduled", requireAuth, getScheduledPosts);
router.post("/:id/view", trackPostView); // Track view (public, optional auth)
router.get("/:id/public", getPublicPost); // Public endpoint untuk SEO (tidak increment views)
router.get("/:id", authenticate, getPost);
router.get("/:id/versions", requireAuth, getPostVersions);
router.post("/:id/versions/:versionId/restore", requireAuth, restorePostVersion);
router.put("/:id", requireAuth, updatePost);
router.delete("/:id", requireAuth, deletePost);

export default router;
