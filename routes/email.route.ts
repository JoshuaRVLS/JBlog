import { Router } from "express";
import {
  sendVerification,
  verifyVerification,
  checkVerify,
} from "../controllers/email.controller";

const router = Router();

router.get("/verify/:code", verifyVerification);
router.post("/check-verify/", checkVerify);
router.post("/send-verification", sendVerification);

export default router;
