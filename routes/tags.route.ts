import { Router } from "express";
import { getAllTags, getTag } from "../controllers/tags.controller";

const router = Router();

router.get("/", getAllTags);
router.get("/:slug", getTag);

export default router;

