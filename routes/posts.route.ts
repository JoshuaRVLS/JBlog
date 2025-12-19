import { Router } from "express";
import {
  createPost,
  updatePost,
  deletePost,
  getPost,
  getAllPosts,
  getTotalViews,
  getPostVersions,
  restorePostVersion,
} from "../controllers/posts.controller";
import { authenticate, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, createPost);
router.get("/", getAllPosts);
router.get("/total-views", getTotalViews); // Public endpoint
router.get("/:id", authenticate, getPost);
router.get("/:id/versions", requireAuth, getPostVersions);
router.post("/:id/versions/:versionId/restore", requireAuth, restorePostVersion);
router.put("/:id", requireAuth, updatePost);
router.delete("/:id", requireAuth, deletePost);

export default router;
