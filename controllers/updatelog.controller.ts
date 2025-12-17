import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

export const getUpdateLogs = async (req: any, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const logs = await db.updateLog.findMany({
      take: limit,
      orderBy: { date: "desc" },
    });

    res.json({ logs });
  } catch (error) {
    console.error("Error fetching update logs:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil update logs",
    });
  }
};

export const syncFromGitHub = async (req: AuthRequest, res: Response) => {
  try {
    const repo = process.env.GITHUB_REPO || "owner/repo";
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "GITHUB_TOKEN tidak dikonfigurasi",
      });
    }

    const response = await fetch(
      `https://api.github.com/repos/${repo}/commits?per_page=20`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Gagal fetch dari GitHub");
    }

    const commits = await response.json();
    const logs = [];

    for (const commit of commits) {
      const existing = await db.updateLog.findFirst({
        where: { commitHash: commit.sha },
      });

      if (existing) continue;

      const message = commit.commit.message;
      const lines = message.split("\n").filter((l: string) => l.trim());
      const title = lines[0] || "Update";
      const description = lines.slice(1).join("\n") || "";
      const changes = lines
        .slice(1)
        .filter((l: string) => l.startsWith("-") || l.startsWith("*"))
        .map((l: string) => l.replace(/^[-*]\s*/, ""));

      const log = await db.updateLog.create({
        data: {
          version: commit.sha.substring(0, 7),
          title,
          description,
          changes,
          commitHash: commit.sha,
          commitUrl: commit.html_url,
          author: commit.commit.author.name,
          date: new Date(commit.commit.author.date),
        },
      });

      logs.push(log);
    }

    res.json({
      msg: `Berhasil sync ${logs.length} update logs`,
      logs,
    });
  } catch (error: any) {
    console.error("Error syncing from GitHub:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || "Gagal sync dari GitHub",
    });
  }
};

export const createUpdateLog = async (req: AuthRequest, res: Response) => {
  try {
    const { version, title, description, changes, commitHash, commitUrl, author, date } =
      req.body;

    if (!version || !title) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Version dan title wajib diisi",
      });
    }

    const log = await db.updateLog.create({
      data: {
        version,
        title,
        description: description || "",
        changes: changes || [],
        commitHash,
        commitUrl,
        author,
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(StatusCodes.CREATED).json({
      msg: "Update log berhasil dibuat",
      log,
    });
  } catch (error) {
    console.error("Error creating update log:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal membuat update log",
    });
  }
};

export const deleteUpdateLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await db.updateLog.delete({
      where: { id },
    });

    res.json({ msg: "Update log berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting update log:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal menghapus update log",
    });
  }
};

