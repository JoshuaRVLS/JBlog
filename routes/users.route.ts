import { Router } from "express";
import { authenticate, requireAuth } from "../middleware/auth.middleware";
import {
  createUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  changeEmail,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
  getUserActivity,
  getUserLocations,
} from "../controllers/users.controller";

const router = Router();

router.post("/", createUser);
router.get("/locations", getUserLocations);
router.get("/:id", getUserProfile);
router.get("/:id/activity", requireAuth, getUserActivity);
router.put("/:id", updateUserProfile);
router.put("/:id/password", changePassword);
router.put("/:id/email", changeEmail);
router.get("/:id/follow-status", authenticate, getFollowStatus);
router.post("/:id/follow", requireAuth, followUser);
router.delete("/:id/follow", requireAuth, unfollowUser);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

export default router;
