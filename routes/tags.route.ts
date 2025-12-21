import { Router } from "express";
import { getAllTags, getTag, getTrendingTags } from "../controllers/tags.controller";

const router = Router();

router.get("/trending", getTrendingTags);
router.get("/", getAllTags);
router.get("/:slug", getTag);

export default router;

