import express from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  generateUserKeyPair,
  getUserPublicKey,
  getGroupEncryptionKey,
  initializeGroupEncryption,
  getGroupMembersPublicKeys,
} from "../controllers/encryption.controller";

const router = express.Router();

router.post("/keys/generate", requireAuth, generateUserKeyPair);
router.get("/keys/user/:userId", requireAuth, getUserPublicKey);
router.get("/keys/group/:groupId", requireAuth, getGroupEncryptionKey);
router.get("/keys/group/:groupId/members", requireAuth, getGroupMembersPublicKeys);
router.post("/keys/group/initialize", requireAuth, initializeGroupEncryption);

export default router;

