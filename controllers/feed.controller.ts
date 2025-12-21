import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";

// Get user feed (posts from followed users)
export const getUserFeed = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Harus login dulu" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get list of users that current user is following
    const following = await db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // If user is not following anyone, return empty feed or suggest posts
    if (followingIds.length === 0) {
      // Return some popular posts as suggestions
      const suggestedPosts = await db.post.findMany({
        where: { published: true },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              claps: true,
              comments: true,
            },
          },
        },
        orderBy: { views: "desc" },
        take: limit,
        skip,
      });

      const total = await db.post.count({
        where: { published: true },
      });

      return res.json({
        posts: suggestedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        message: "Mulai follow user untuk melihat feed mereka!",
      });
    }

    // Get posts from followed users
    const [posts, total] = await Promise.all([
      db.post.findMany({
        where: {
          authorId: { in: followingIds },
          published: true,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              claps: true,
              comments: true,
              reposts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.post.count({
        where: {
          authorId: { in: followingIds },
          published: true,
        },
      }),
    ]);

    // Batch check if user has clapped, bookmarked, or reposted each post (optimize N+1 query)
    const postIds = posts.map((p) => p.id);
    const [claps, bookmarks, reposts] = await Promise.all([
      db.clap.findMany({
        where: {
          postId: { in: postIds },
          userId,
        },
        select: { postId: true },
      }),
      db.bookmark.findMany({
        where: {
          userId,
          postId: { in: postIds },
        },
        select: { postId: true },
      }),
      db.repost.findMany({
        where: {
          userId,
          postId: { in: postIds },
        },
        select: { postId: true },
      }),
    ]);

    // Create sets for O(1) lookup
    const clappedPostIds = new Set(claps.map((c) => c.postId));
    const bookmarkedPostIds = new Set(bookmarks.map((b) => b.postId));
    const repostedPostIds = new Set(reposts.map((r) => r.postId));

    // Map posts with status (O(n) instead of O(n*3))
    const postsWithStatus = posts.map((post) => ({
      ...post,
      hasClapped: clappedPostIds.has(post.id),
      isBookmarked: bookmarkedPostIds.has(post.id),
      isReposted: repostedPostIds.has(post.id),
    }));

    res.json({
      posts: postsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error get user feed:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil feed",
      details: error.message,
    });
  }
};

