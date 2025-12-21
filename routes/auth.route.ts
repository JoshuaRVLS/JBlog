import { Router, type Request } from "express";
import {
  loginUser,
  logout,
  refreshToken,
  validate,
  getSocketToken,
} from "../controllers/auth.controller";
import {
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from "../controllers/password.controller";
import {
  googleCallback,
  githubCallback,
  getGoogleAuthUrl,
  getGithubAuthUrl,
} from "../controllers/oauth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", loginUser);
router.delete("/logout", logout);

// OAuth routes
router.get("/google/url", getGoogleAuthUrl);
router.get("/google/callback", googleCallback);
router.get("/github/url", getGithubAuthUrl);
router.get("/github/callback", githubCallback);
router.post("/validate", validate);
router.post("/refresh", refreshToken);
router.get("/socket-token", authenticate, getSocketToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-reset-token/:token", verifyResetToken);

export default router;
