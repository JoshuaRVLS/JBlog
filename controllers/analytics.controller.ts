import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";

// Get post analytics
export const getPostAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    const { postId } = req.params;

    // Check if post exists and user owns it
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Post tidak ditemukan" });
    }

    if (post.authorId !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Tidak memiliki akses" });
    }

    // Get total views
    const totalViews = await db.postView.count({
      where: { postId },
    });

    // Get views over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsOverTime = await db.postView.groupBy({
      by: ["createdAt"],
      where: {
        postId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get engagement metrics
    const [claps, reactions, comments, bookmarks, reposts] = await Promise.all([
      db.clap.count({ where: { postId } }),
      db.reaction.count({ where: { postId } }),
      db.comment.count({ where: { postId } }),
      db.bookmark.count({ where: { postId } }),
      db.repost.count({ where: { postId } }),
    ]);

    // Get reaction breakdown
    const reactionBreakdown = await db.reaction.groupBy({
      by: ["type"],
      where: { postId },
      _count: { type: true },
    });

    const reactionsByType = reactionBreakdown.reduce((acc, curr) => {
      acc[curr.type] = curr._count.type;
      return acc;
    }, {} as Record<string, number>);

    // Get views by day (for chart)
    const viewsByDay = await db.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM "PostView"
      WHERE post_id = ${postId}
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    res.status(StatusCodes.OK).json({
      totalViews,
      viewsOverTime: viewsByDay,
      engagement: {
        claps,
        reactions,
        comments,
        bookmarks,
        reposts,
        total: claps + reactions + comments + bookmarks + reposts,
      },
      reactionsByType,
    });
  } catch (error: any) {
    console.error("Error getting post analytics:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal mengambil analytics",
      error: error.message,
    });
  }
};

// Get user's overall analytics
export const getUserAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Harus login dulu" });
    }

    // Get all user's posts
    const posts = await db.post.findMany({
      where: { authorId: userId },
      select: { id: true, published: true },
    });

    const postIds = posts.map((p) => p.id);

    // Get total stats
    const [
      totalViews,
      totalClaps,
      totalReactions,
      totalComments,
      totalBookmarks,
      totalReposts,
    ] = await Promise.all([
      db.postView.count({
        where: { postId: { in: postIds } },
      }),
      db.clap.count({
        where: { postId: { in: postIds } },
      }),
      db.reaction.count({
        where: { postId: { in: postIds } },
      }),
      db.comment.count({
        where: { postId: { in: postIds } },
      }),
      db.bookmark.count({
        where: { postId: { in: postIds } },
      }),
      db.repost.count({
        where: { postId: { in: postIds } },
      }),
    ]);

    // Get posts stats
    const publishedPosts = posts.filter((p) => p.published).length;
    const draftPosts = posts.filter((p) => !p.published).length;

    // Get views over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsByDay = await db.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM "PostView"
      WHERE post_id = ANY(${postIds})
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get top performing posts
    const topPosts = await db.post.findMany({
      where: { authorId: userId, published: true },
      include: {
        _count: {
          select: {
            claps: true,
            reactions: true,
            comments: true,
            bookmarks: true,
            reposts: true,
          },
        },
      },
      orderBy: { views: "desc" },
      take: 5,
    });

    res.status(StatusCodes.OK).json({
      posts: {
        total: posts.length,
        published: publishedPosts,
        drafts: draftPosts,
      },
      views: {
        total: totalViews,
        overTime: viewsByDay,
      },
      engagement: {
        claps: totalClaps,
        reactions: totalReactions,
        comments: totalComments,
        bookmarks: totalBookmarks,
        reposts: totalReposts,
        total: totalClaps + totalReactions + totalComments + totalBookmarks + totalReposts,
      },
      topPosts: topPosts.map((post) => ({
        id: post.id,
        title: post.title,
        views: post.views,
        engagement: 
          post._count.claps +
          post._count.reactions +
          post._count.comments +
          post._count.bookmarks +
          post._count.reposts,
      })),
    });
  } catch (error: any) {
    console.error("Error getting user analytics:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Gagal mengambil analytics",
      error: error.message,
    });
  }
};

