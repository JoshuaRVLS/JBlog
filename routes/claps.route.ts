import { Router } from "express";
import { toggleClap, getClapsCount } from "../controllers/claps.controller";
import { authenticate, requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/:postId", requireAuth, toggleClap);
router.get("/:postId", authenticate, getClapsCount);

export default router;

