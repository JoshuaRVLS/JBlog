import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as collectionsController from "../controllers/collections.controller";

const router = Router();

// Get user's collections
router.get("/collections", authenticate, collectionsController.getUserCollections);

// Get public collections by user
router.get("/users/:userId/collections", collectionsController.getPublicCollections);

// Create collection
router.post("/collections", authenticate, collectionsController.createCollection);

// Get collection with posts
router.get("/collections/:id", collectionsController.getCollection);

// Update collection
router.put("/collections/:id", authenticate, collectionsController.updateCollection);

// Delete collection
router.delete("/collections/:id", authenticate, collectionsController.deleteCollection);

// Add post to collection
router.post("/collections/:id/posts", authenticate, collectionsController.addPostToCollection);

// Remove post from collection
router.delete("/collections/:id/posts/:postId", authenticate, collectionsController.removePostFromCollection);

export default router;

