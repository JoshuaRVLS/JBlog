import { Router } from "express";
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from "../controllers/comments.controller";
import { authenticate, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/:postId", requireAuth, createComment);
router.get("/:postId", authenticate, getComments);
router.put("/:id", requireAuth, updateComment);
router.delete("/:id", requireAuth, deleteComment);
router.post("/:id/like", requireAuth, toggleCommentLike);

export default router;

