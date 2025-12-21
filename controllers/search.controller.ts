import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

// Unified search for posts and users
export const searchAll = async (req: AuthRequest, res: Response) => {
  try {
    const { q, type, limit = 10 } = req.query;
    const searchQuery = (q as string)?.trim();

    if (!searchQuery || searchQuery.length < 2) {
      return res.json({
        posts: [],
        users: [],
      });
    }

    const searchLimit = Math.min(Number(limit), 20);

    // Search posts
    const posts = type === "users" ? [] : await db.post.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { excerpt: { contains: searchQuery, mode: "insensitive" } },
          { content: { contains: searchQuery, mode: "insensitive" } },
        ],
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: searchLimit,
    });

    // Search users
    const users = type === "posts" ? [] : await db.user.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { email: { contains: searchQuery, mode: "insensitive" } },
          { bio: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profilePicture: true,
        isVerified: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: searchLimit,
    });

    res.json({
      posts,
      users,
      query: searchQuery,
    });
  } catch (error: any) {
    console.error("Error search:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal melakukan pencarian",
      details: error.message,
    });
  }
};

// Get most popular posts (by claps)
export const getMostPopularPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const postsLimit = Math.min(Number(limit), 50);

    // Get all published posts with their clap counts
    const allPosts = await db.post.findMany({
      where: {
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
        claps: true,
        _count: {
          select: {
            claps: true,
            comments: true,
          },
        },
      },
    });

    // Sort by clap count (descending), then by createdAt (descending)
    const sortedPosts = allPosts.sort((a, b) => {
      const clapDiff = b._count.claps - a._count.claps;
      if (clapDiff !== 0) return clapDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const posts = sortedPosts.slice(0, postsLimit);

    res.json({ posts });
  } catch (error: any) {
    console.error("Error mengambil popular posts:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil popular posts",
      details: error.message,
    });
  }
};

// Get most recent posts
export const getMostRecentPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const postsLimit = Math.min(Number(limit), 50);

    const posts = await db.post.findMany({
      where: {
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: postsLimit,
    });

    res.json({ posts });
  } catch (error: any) {
    console.error("Error mengambil recent posts:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil recent posts",
      details: error.message,
    });
  }
};

// Get search suggestions (popular posts titles and tags)
export const getSearchSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const suggestionsLimit = Math.min(Number(limit), 15);

    // Get popular posts titles (by claps + views)
    const allPosts = await db.post.findMany({
      where: {
        published: true,
      },
      select: {
        title: true,
        views: true,
        createdAt: true,
        _count: {
          select: {
            claps: true,
            comments: true,
          },
        },
      },
      take: 100, // Get more to sort properly
    });

    // Sort by score (claps + comments*2 + views)
    const popularPosts = allPosts
      .map((post) => ({
        title: post.title,
        score: post._count.claps + post._count.comments * 2 + post.views,
        views: post.views,
        createdAt: post.createdAt,
      }))
      .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, suggestionsLimit);

    // Get popular tags (by post count)
    const popularTags = await db.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
      take: suggestionsLimit,
    });

    // Combine and format suggestions
    const suggestions = [
      ...popularPosts.map((post) => ({
        type: "post" as const,
        text: post.title,
        score: post.score,
      })),
      ...popularTags.map((tag) => ({
        type: "tag" as const,
        text: tag.name,
        score: tag._count.posts,
      })),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, suggestionsLimit)
      .map((s) => s.text);

    res.json({ suggestions });
  } catch (error: any) {
    console.error("Error mengambil search suggestions:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil suggestions",
      details: error.message,
    });
  }
};

// Get recommended users (users with most followers, excluding current user and already followed)
export const getRecommendedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const usersLimit = Math.min(Number(limit), 20);
    const currentUserId = req.userId;

    // Get users that current user is already following
    const followingIds = currentUserId
      ? (
          await db.follow.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true },
          })
        ).map((f) => f.followingId)
      : [];

    // Get recommended users (most followers, verified users prioritized)
    const users = await db.user.findMany({
      where: {
        id: {
          notIn: currentUserId
            ? [currentUserId, ...followingIds]
            : [],
        },
        isVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profilePicture: true,
        isVerified: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: [
        { isVerified: "desc" },
        {
          followers: {
            _count: "desc",
          },
        },
        {
          posts: {
            _count: "desc",
          },
        },
      ],
      take: usersLimit,
    });

    res.json({ users });
  } catch (error: any) {
    console.error("Error mengambil recommended users:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil recommended users",
      details: error.message,
    });
  }
};

