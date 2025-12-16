import { Router } from "express";
import {
  searchAll,
  getMostPopularPosts,
  getMostRecentPosts,
  getRecommendedUsers,
} from "../controllers/search.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All search routes are public (optional auth for personalized results)
router.get("/", authenticate, searchAll);
router.get("/popular", authenticate, getMostPopularPosts);
router.get("/recent", authenticate, getMostRecentPosts);
router.get("/recommended-users", authenticate, getRecommendedUsers);

export default router;

