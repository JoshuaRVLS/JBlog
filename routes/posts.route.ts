import { Router } from "express";
import {
  createPost,
  updatePost,
  deletePost,
  getPost,
  getAllPosts,
  getTotalViews,
} from "../controllers/posts.controller";
import { authenticate, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, createPost);
router.get("/", getAllPosts);
router.get("/total-views", getTotalViews); // Public endpoint
router.get("/:id", authenticate, getPost);
router.put("/:id", requireAuth, updatePost);
router.delete("/:id", requireAuth, deletePost);

export default router;
