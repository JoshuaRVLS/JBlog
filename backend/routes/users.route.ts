import { Router, type Request } from "express";
import { createUser, loginUser } from "../controllers/users.controller";

const router = Router();

router.post('/', createUser);
router.post('/login', loginUser);

export default router;
