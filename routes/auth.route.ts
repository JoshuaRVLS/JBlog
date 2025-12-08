import { Router, type Request } from "express";
import {
  loginUser,
  logout,
  refreshToken,
  validate,
} from "../controllers/auth.controller";

const router = Router();

router.post("/login", loginUser);
router.delete("/logout", logout);
router.post("/validate", validate);
router.post("/refresh", refreshToken);

export default router;
