import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as analyticsController from "../controllers/analytics.controller";

const router = Router();

// Get post analytics
router.get("/posts/:postId/analytics", authenticate, analyticsController.getPostAnalytics);

// Get user analytics
router.get("/analytics", authenticate, analyticsController.getUserAnalytics);

export default router;

