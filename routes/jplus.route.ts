import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  getJPlusStatus,
  upgradeToJPlus,
  cancelJPlus,
} from "../controllers/jplus.controller";

const router = Router();

router.get("/status", requireAuth, getJPlusStatus);
router.post("/upgrade", requireAuth, upgradeToJPlus);
router.post("/cancel", requireAuth, cancelJPlus);

export default router;

