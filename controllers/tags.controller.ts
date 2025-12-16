import type { Request, Response } from "express";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

export const getAllTags = async (req: Request, res: Response) => {
  try {
    const tags = await db.tag.findMany({
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
    });

    res.json({ tags });
  } catch (error) {
    console.error("Get tags error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to get tags" });
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

