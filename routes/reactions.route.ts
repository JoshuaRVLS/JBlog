import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as reactionsController from "../controllers/reactions.controller";

const router = Router();

// Add or update reaction
router.post("/posts/:postId/reactions", authenticate, reactionsController.addReaction);

// Remove reaction
router.delete("/posts/:postId/reactions", authenticate, reactionsController.removeReaction);

// Get post reactions (public, optional auth untuk userReaction)
router.get("/posts/:postId/reactions", authenticate, reactionsController.getPostReactions);

export default router;

