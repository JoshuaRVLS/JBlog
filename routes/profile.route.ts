import { Router } from "express";
import {
  updateProfile,
  getCurrentProfile,
  changePassword,
  changeEmail,
  changeCountry,
  deleteOwnAccount,
} from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, getCurrentProfile);
router.put("/", requireAuth, updateProfile);
router.put("/password", requireAuth, changePassword);
router.put("/email", requireAuth, changeEmail);
router.put("/country", requireAuth, changeCountry);
router.delete("/", requireAuth, deleteOwnAccount);

export default router;

