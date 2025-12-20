import { Router } from "express";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllAdmins,
  createAdmin,
  removeAdmin,
  getAllPostsAdmin,
  deletePostAdmin,
  updatePostAdmin,
  suspendUser,
  unsuspendUser,
  getMaintenanceMode,
  toggleMaintenanceMode,
} from "../controllers/admin.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

// All admin routes require authentication and admin access
router.use(requireAuth);
router.use(requireAdmin);

// User Management
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.post("/users/:id/suspend", suspendUser);
router.post("/users/:id/unsuspend", unsuspendUser);
router.delete("/users/:id", deleteUser);

// Admin Management
router.get("/admins", getAllAdmins);
router.post("/admins", createAdmin);
router.delete("/admins/:id", removeAdmin);

// Post Management
router.get("/posts", getAllPostsAdmin);
router.put("/posts/:id", updatePostAdmin);
router.delete("/posts/:id", deletePostAdmin);

// Maintenance Mode
router.get("/maintenance", getMaintenanceMode);
router.put("/maintenance", toggleMaintenanceMode);

export default router;

