import { Router } from "express";
import { upload, uploadMedia, uploadImage, uploadAvatar, uploadChatMedia } from "../controllers/upload.controller";
import { uploadGroupLogo } from "../controllers/groupchat.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/image", requireAuth, upload.single("image"), uploadImage);
router.post("/avatar", requireAuth, upload.single("avatar"), uploadAvatar);
router.post("/chat-media", requireAuth, uploadMedia.single("media"), uploadChatMedia);
router.post("/group-logo/:id", requireAuth, upload.single("logo"), uploadGroupLogo);

export default router;

