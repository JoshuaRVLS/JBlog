import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

// Helper function to calculate reading time
const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const text = content.replace(/[#*`]/g, "").trim();
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute) || 1;
};

// Helper function to create or get tags
const processTags = async (tagNames: string[]) => {
  const tags = [];
  for (const name of tagNames || []) {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    let tag = await db.tag.findUnique({ where: { slug } });
    if (!tag) {
      tag = await db.tag.create({
        data: { name, slug },
      });
    }
    tags.push(tag.id);
  }
  return tags;
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, excerpt, coverImage, published, tags } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Authentication required" });
    }

    // Semua authenticated user bisa membuat post
    const readingTime = calculateReadingTime(content);
    const tagIds = await processTags(tags);

    const post = await db.post.create({
      data: {
        title,
        content,
        excerpt,
        coverImage,
        published: published || false,
        authorId: userId,
        readingTime,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
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
    });

    console.log(`✅ Post berhasil dibuat - ID: ${post.id}, Judul: ${post.title}`);
    res
      .status(StatusCodes.CREATED)
      .json({ msg: "Post berhasil dibuat", post });
  } catch (error) {
    console.error("❌ Error membuat post:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal membuat post" });
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, coverImage, published, tags } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }

    // Cek apakah post ada
    const existingPost = await db.post.findUnique({ where: { id } });
    if (!existingPost) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Post tidak ditemukan" });
    }

    // Cek apakah user adalah author post atau admin/owner
    const user = await db.user.findUnique({ where: { id: userId } });
    if (existingPost.authorId !== userId && !user?.isOwner && !user?.isAdmin) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: "Hanya author, owner, atau admin yang bisa mengupdate post" });
    }

    const updateData: any = { title, excerpt, coverImage, published };
    if (content) {
      updateData.content = content;
      updateData.readingTime = calculateReadingTime(content);
    }

    // Simpan versi lama sebelum update (versioning)
    await db.postVersion.create({
      data: {
        postId: existingPost.id,
        title: existingPost.title,
        content: existingPost.content,
        excerpt: existingPost.excerpt,
        coverImage: existingPost.coverImage,
        createdBy: userId,
      },
    });

    // Update tags if provided
    if (tags) {
      // Delete existing tags
      await db.postTag.deleteMany({ where: { postId: id } });
      // Add new tags
      const tagIds = await processTags(tags);
      updateData.tags = {
        create: tagIds.map((tagId) => ({ tagId })),
      };
    }

    const post = await db.post.update({
      where: { id },
      data: updateData,
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
    });

    console.log(`✅ Post berhasil diupdate - ID: ${id}`);
    res.json({ msg: "Post berhasil diupdate", post });
  } catch (error) {
    console.error("❌ Error update post:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengupdate post" });
  }
};

export const getPostVersions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }

    const post = await db.post.findUnique({
      where: { id },
      select: {
        authorId: true,
      },
    });

    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Post tidak ditemukan" });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (post.authorId !== userId && !user?.isOwner && !user?.isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: "Hanya author, owner, atau admin yang bisa melihat riwayat versi post",
      });
    }

    const versions = await db.postVersion.findMany({
      where: { postId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    res.json({ versions });
  } catch (error) {
    console.error("❌ Error mengambil versi post:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil versi post" });
  }
};

export const restorePostVersion = async (req: AuthRequest, res: Response) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }

    const post = await db.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Post tidak ditemukan" });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (post.authorId !== userId && !user?.isOwner && !user?.isAdmin) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: "Hanya author, owner, atau admin yang bisa merestore versi post",
      });
    }

    const version = await db.postVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.postId !== id) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Versi post tidak ditemukan" });
    }

    // Simpan versi saat ini sebelum restore (supaya bisa undo)
    await db.postVersion.create({
      data: {
        postId: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        createdBy: userId,
      },
    });

    const updatedPost = await db.post.update({
      where: { id },
      data: {
        title: version.title,
        content: version.content,
        excerpt: version.excerpt,
        coverImage: version.coverImage,
        readingTime: calculateReadingTime(version.content),
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
    });

    res.json({
      msg: "Post berhasil direstore ke versi terpilih",
      post: updatedPost,
    });
  } catch (error) {
    console.error("❌ Error merestore versi post:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal merestore versi post" });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Harus login dulu" });
    }

    // Cek apakah user adalah owner atau admin
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.isOwner && !user?.isAdmin) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: "Hanya owner dan admin yang bisa menghapus post" });
    }

    const existingPost = await db.post.findUnique({ where: { id } });
    if (!existingPost) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Post tidak ditemukan" });
    }

    await db.post.delete({ where: { id } });

    console.log(`✅ Post berhasil dihapus - ID: ${id}`);
    res.json({ msg: "Post berhasil dihapus" });
  } catch (error) {
    console.error("❌ Error hapus post:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal menghapus post" });
  }
};

export const getPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            bio: true,
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
        claps: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!post) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Post tidak ditemukan" });
    }

    // Check bookmark and repost status
    let isBookmarked = false;
    let isReposted = false;
    if (userId) {
      const [bookmark, repost] = await Promise.all([
        db.bookmark.findUnique({
          where: {
            userId_postId: {
              userId,
              postId: String(id),
            },
          },
        }),
        db.repost.findUnique({
          where: {
            userId_postId: {
              userId,
              postId: String(id),
            },
          },
        }),
      ]);
      isBookmarked = !!bookmark;
      isReposted = !!repost;
    }

    // Increment views count
    await db.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    res.json({
      ...post,
      views: post.views + 1, // Return incremented value
      hasClapped: userId ? post.claps.length > 0 : false,
      isBookmarked,
      isReposted,
    });
  } catch (error) {
    console.error("❌ Error mengambil post:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil post" });
  }
};

export const getAllPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { published, authorId, tag, search, page = 1, limit = 10 } = req.query;

    const where: any = {};
    if (published !== undefined) where.published = published === "true";
    if (authorId) where.authorId = authorId;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { excerpt: { contains: search as string, mode: "insensitive" } },
        { content: { contains: search as string, mode: "insensitive" } },
      ];
    }
    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag as string,
          },
        },
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
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
        take: Number(limit),
      }),
      db.post.count({ where }),
    ]);

    // Get user ID from request if authenticated
    const userId = (req as AuthRequest).userId;

    // Check bookmark and repost status for each post if user is authenticated
    const postsWithStatus = userId
      ? await Promise.all(
          posts.map(async (post) => {
            const [hasClapped, isBookmarked, isReposted] = await Promise.all([
              db.clap.findUnique({
                where: {
                  postId_userId: {
                    postId: post.id,
                    userId,
                  },
                },
              }),
              db.bookmark.findUnique({
                where: {
                  userId_postId: {
                    userId,
                    postId: post.id,
                  },
                },
              }),
              db.repost.findUnique({
                where: {
                  userId_postId: {
                    userId,
                    postId: post.id,
                  },
                },
              }),
            ]);

            return {
              ...post,
              hasClapped: !!hasClapped,
              isBookmarked: !!isBookmarked,
              isReposted: !!isReposted,
            };
          })
        )
      : posts.map((post) => ({
          ...post,
          hasClapped: false,
          isBookmarked: false,
          isReposted: false,
        }));

    res.json({
      posts: postsWithStatus,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error mengambil posts:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil posts" });
  }
};

// Get total views across all published posts
export const getTotalViews = async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.post.aggregate({
      where: {
        published: true,
      },
      _sum: {
        views: true,
      },
    });

    const totalViews = result._sum.views || 0;

    res.json({ totalViews });
  } catch (error) {
    console.error("❌ Error mengambil total views:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Gagal mengambil total views" });
  }
};
