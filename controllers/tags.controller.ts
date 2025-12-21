import type { Request, Response } from "express";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

export const getAllTags = async (req: Request, res: Response) => {
  try {
    const { trending } = req.query;
    
    const orderBy = trending === "true" 
      ? { postCount: "desc" as const }
      : { posts: { _count: "desc" as const } };

    const tags = await db.tag.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy,
    });

    res.json({ tags });
  } catch (error) {
    console.error("Get tags error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to get tags" });
  }
};

// Get trending tags
export const getTrendingTags = async (req: Request, res: Response) => {
  try {
    const { limit = "10" } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const tags = await db.tag.findMany({
      where: {
        postCount: {
          gt: 0,
        },
      },
      orderBy: {
        postCount: "desc",
      },
      take: limitNum,
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    res.json({ tags });
  } catch (error) {
    console.error("Get trending tags error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to get trending tags" });
  }
};

export const getTag = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const tag = await db.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!tag) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Tag not found" });
    }

    res.json({ tag });
  } catch (error) {
    console.error("Get tag error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to get tag" });
  }
};

