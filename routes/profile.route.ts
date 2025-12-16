import { Router } from "express";
import { updateProfile, getCurrentProfile, changePassword } from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, getCurrentProfile);
router.put("/", requireAuth, updateProfile);
router.put("/password", requireAuth, changePassword);

export default router;

