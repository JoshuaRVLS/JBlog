import { Router } from "express";
import {
  updateProfile,
  getCurrentProfile,
  changePassword,
  requestEmailChange,
  verifyEmailChange,
  changeCountry,
  deleteOwnAccount,
} from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, getCurrentProfile);
router.put("/", requireAuth, updateProfile);
router.put("/password", requireAuth, changePassword);
router.post("/email/request-change", requireAuth, requestEmailChange);
router.post("/email/verify-change", requireAuth, verifyEmailChange);
router.put("/country", requireAuth, changeCountry);
router.delete("/", requireAuth, deleteOwnAccount);

export default router;

