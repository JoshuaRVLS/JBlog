import { Router } from "express";
import { upload, uploadMedia, uploadImage, uploadAvatar, uploadChatMedia } from "../controllers/upload.controller";
import { uploadGroupLogo, uploadGroupBanner } from "../controllers/groupchat.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { uploadRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.post("/image", requireAuth, uploadRateLimiter, upload.single("image"), uploadImage);
router.post("/avatar", requireAuth, uploadRateLimiter, upload.single("avatar"), uploadAvatar);
router.post("/chat-media", requireAuth, uploadRateLimiter, uploadMedia.single("media"), uploadChatMedia);
router.post("/group-logo/:id", requireAuth, uploadRateLimiter, upload.single("logo"), uploadGroupLogo);
router.post("/group-banner/:id", requireAuth, uploadRateLimiter, upload.single("banner"), uploadGroupBanner);

export default router;

