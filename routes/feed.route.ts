import { Router } from "express";
import { getUserFeed } from "../controllers/feed.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, getUserFeed);

export default router;

