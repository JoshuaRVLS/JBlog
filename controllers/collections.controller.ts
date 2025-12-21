import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";

// Get user's collections
export const getUserCollections = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const collections = await db.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.status(StatusCodes.OK).json({ collections });
  } catch (error: any) {
    console.error("Error getting collections:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal mengambil collections",
      error: error.message,
    });
  }
};

// Get public collections
export const getPublicCollections = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;

    const collections = await db.collection.findMany({
      where: {
        userId: targetUserId,
        isPublic: true,
      },
      include: {
        _count: {
          select: { posts: true },
        },
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.status(StatusCodes.OK).json({ collections });
  } catch (error: any) {
    console.error("Error getting public collections:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal mengambil collections",
      error: error.message,
    });
  }
};

// Create collection
export const createCollection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { name, description, isPublic } = req.body;

    if (!name || !name.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Nama collection harus diisi" });
    }

    const collection = await db.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: isPublic || false,
        userId,
      },
    });

    res.status(StatusCodes.CREATED).json({
      msg: "Collection berhasil dibuat",
      collection,
    });
  } catch (error: any) {
    console.error("Error creating collection:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal membuat collection",
      error: error.message,
    });
  }
};

// Update collection
export const updateCollection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { id } = req.params;
    const { name, description, isPublic } = req.body;

    // Check ownership
    const existingCollection = await db.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Collection tidak ditemukan" });
    }

    if (existingCollection.userId !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Tidak memiliki akses" });
    }

    const collection = await db.collection.update({
      where: { id },
      data: {
        name: name?.trim() || existingCollection.name,
        description: description !== undefined ? description?.trim() || null : existingCollection.description,
        isPublic: isPublic !== undefined ? isPublic : existingCollection.isPublic,
      },
    });

    res.status(StatusCodes.OK).json({
      msg: "Collection berhasil diupdate",
      collection,
    });
  } catch (error: any) {
    console.error("Error updating collection:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal mengupdate collection",
      error: error.message,
    });
  }
};

// Delete collection
export const deleteCollection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { id } = req.params;

    // Check ownership
    const existingCollection = await db.collection.findUnique({
      where: { id },
    });

    if (!existingCollection) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Collection tidak ditemukan" });
    }

    if (existingCollection.userId !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Tidak memiliki akses" });
    }

    await db.collection.delete({
      where: { id },
    });

    res.status(StatusCodes.OK).json({ msg: "Collection berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting collection:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal menghapus collection",
      error: error.message,
    });
  }
};

// Get collection with posts
export const getCollection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const collection = await db.collection.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        posts: {
          include: {
            post: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    profilePicture: true,
                  },
                },
                _count: {
                  select: {
                    claps: true,
                    reactions: true,
                    comments: true,
                    bookmarks: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!collection) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Collection tidak ditemukan" });
    }

    // Check if user can view (public or owner)
    if (!collection.isPublic && collection.userId !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Collection ini bersifat private" });
    }

    res.status(StatusCodes.OK).json({ collection });
  } catch (error: any) {
    console.error("Error getting collection:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal mengambil collection",
      error: error.message,
    });
  }
};

// Add post to collection
export const addPostToCollection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { id } = req.params;
    const { postId } = req.body;

    if (!postId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "postId harus diisi" });
    }

    // Check collection ownership
    const collection = await db.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Collection tidak ditemukan" });
    }

    if (collection.userId !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Tidak memiliki akses" });
    }

    // Check if post exists
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Post tidak ditemukan" });
    }

    // Add post to collection
    if (!id || !postId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Collection ID and post ID are required" });
    }

    await db.collectionPost.create({
      data: {
        collectionId: id,
        postId,
      },
    });

    res.status(StatusCodes.OK).json({ msg: "Post berhasil ditambahkan ke collection" });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(StatusCodes.CONFLICT).json({ msg: "Post sudah ada di collection ini" });
    }
    console.error("Error adding post to collection:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal menambahkan post ke collection",
      error: error.message,
    });
  }
};

// Remove post from collection
export const removePostFromCollection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { id, postId } = req.params;

    if (!id || !postId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Collection ID and post ID are required" });
    }

    // Check collection ownership
    const collection = await db.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Collection tidak ditemukan" });
    }

    if (collection.userId !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Tidak memiliki akses" });
    }

    await db.collectionPost.delete({
      where: {
        collectionId_postId: {
          collectionId: id,
          postId,
        },
      },
    });

    res.status(StatusCodes.OK).json({ msg: "Post berhasil dihapus dari collection" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Post tidak ditemukan di collection ini" });
    }
    console.error("Error removing post from collection:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal menghapus post dari collection",
      error: error.message,
    });
  }
};

