import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { StatusCodes } from "http-status-codes";

export const getUpdateLogs = async (req: any, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || "10");
    const cursor = req.query.cursor as string | undefined; // Cursor untuk pagination
    const skip = cursor ? 1 : 0; // Skip cursor item jika ada

    const where = cursor
      ? {
          date: {
            lt: new Date(cursor), // Get logs before this date
          },
        }
      : {};

    const logs = await db.updateLog.findMany({
      where,
      take: limit,
      skip,
      orderBy: { date: "desc" },
    });

    // Get next cursor (date of last item)
    const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
    const nextCursor = lastLog?.date ? lastLog.date.toISOString() : null;
    const hasMore = logs.length === limit;

    res.json({
      logs,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching update logs:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil update logs",
    });
  }
};

/**
 * Parse commit message untuk extract informasi update
 */
const parseCommitMessage = (message: string) => {
  const lines = message.split("\n").filter((l: string) => l.trim());
  const firstLine = lines[0] || "";
  
  // Support conventional commits format (feat:, fix:, etc)
  const conventionalCommitRegex = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?:\s*(.+)/i;
  const match = firstLine.match(conventionalCommitRegex);
  
  let title = firstLine;
  let type = "chore";
  
  if (match && match[1] && match[3]) {
    type = match[1].toLowerCase();
    title = match[3];
  }
  
  // Extract version dari commit message (v1.0.0, version 1.0.0, etc)
  const versionMatch = firstLine.match(/(?:v|version\s+)(\d+\.\d+\.\d+)/i);
  const version = versionMatch ? versionMatch[1] : null;
  
  // Extract description (baris setelah title)
  const descriptionLines = lines.slice(1).filter((l: string) => {
    const trimmed = l.trim();
    return trimmed && !trimmed.match(/^[-*]\s+/); // Exclude bullet points
  });
  const description = descriptionLines.join("\n") || "";
  
  // Extract changes (baris yang dimulai dengan - atau *)
  const changes = lines
    .slice(1)
    .filter((l: string) => {
      const trimmed = l.trim();
      return trimmed.match(/^[-*]\s+/);
    })
    .map((l: string) => l.replace(/^[-*]\s+/, "").trim())
    .filter((l: string) => l.length > 0);
  
  return {
    title,
    description,
    changes,
    version,
    type,
  };
};

export const syncFromGitHub = async (req: AuthRequest, res: Response) => {
  try {
    const repo = process.env.GITHUB_REPO || process.env.NEXT_PUBLIC_GITHUB_REPO || "JoshuaRVLS/JBlog";
    const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;

    // Debug logging (remove in production)
    console.log("🔍 Checking GitHub token...");
    console.log("  - GITHUB_REPO:", repo);
    console.log("  - GITHUB_TOKEN exists:", !!token);
    console.log("  - GITHUB_TOKEN length:", token ? token.length : 0);

    if (!token) {
      console.error("GITHUB_TOKEN tidak ditemukan di environment variables");
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "GITHUB_TOKEN tidak dikonfigurasi. Silakan tambahkan GITHUB_TOKEN di file .env backend dengan format: GITHUB_TOKEN=ghp_your_token_here",
        error: "GITHUB_TOKEN_MISSING",
        instructions: "Tambahkan GITHUB_TOKEN di backend/.env file. Dapatkan token dari GitHub Settings > Developer settings > Personal access tokens > Tokens (classic). Setelah menambahkan, restart backend server.",
      });
    }

    const perPage = parseInt((req.query?.per_page as string) || "50") || 50;
    const branches = ["main", "backend", "frontend"]; // Fetch from all branches

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    };

    // Fetch commits from all branches
    console.log(`📦 Fetching commits from ${branches.length} branches...`);
    const allCommitsPromises = branches.map(async (branch) => {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${repo}/commits?sha=${branch}&per_page=${perPage}`,
          { headers }
        );

        if (!response.ok) {
          console.warn(`Failed to fetch from branch ${branch}: ${response.status}`);
          return [];
        }

        const commits = (await response.json()) as any[];
        // Add branch info to each commit
        return commits.map((commit: any) => ({
          ...commit,
          branch,
        }));
      } catch (error: any) {
        console.error(`Error fetching from branch ${branch}:`, error.message);
        return [];
      }
    });

    const allCommitsArrays = await Promise.all(allCommitsPromises);
    
    // Merge all commits and remove duplicates by commit hash
    const commitsMap = new Map<string, any>();
    for (const commits of allCommitsArrays) {
      for (const commit of commits) {
        const hash = commit.sha;
        if (!commitsMap.has(hash)) {
          commitsMap.set(hash, commit);
        } else {
          // If commit exists, merge branch info
          const existing = commitsMap.get(hash);
          if (!existing.branches) {
            existing.branches = [existing.branch];
          }
          if (!existing.branches.includes(commit.branch)) {
            existing.branches.push(commit.branch);
          }
        }
      }
    }

    // Convert map to array and sort by date (newest first)
    const allCommits = Array.from(commitsMap.values()).sort((a, b) => {
      const dateA = new Date(a.commit.author.date).getTime();
      const dateB = new Date(b.commit.author.date).getTime();
      return dateB - dateA; // Descending order
    });

    console.log(`Fetched ${allCommits.length} unique commits from ${branches.length} branches`);

    const logs = [];
    let skipped = 0;

    for (const commit of allCommits) {
      // Skip jika commit sudah ada
      const existing = await db.updateLog.findFirst({
        where: { commitHash: commit.sha },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const message = commit.commit.message;
      const parsed = parseCommitMessage(message);
      
      // Skip merge commits dan empty commits
      if (message.toLowerCase().startsWith("merge") || !parsed.title.trim()) {
        skipped++;
        continue;
      }

      // Generate version jika tidak ada di commit message
      const version = parsed.version || commit.sha.substring(0, 7);

      // Add branch info to description if commit exists in multiple branches
      let description = parsed.description;
      const branches = commit.branches || [commit.branch];
      if (branches.length > 1) {
        const branchInfo = `\n\n[Branches: ${branches.join(", ")}]`;
        description = description ? description + branchInfo : branchInfo.trim();
      } else if (branches.length === 1) {
        const branchInfo = `\n\n[Branch: ${branches[0]}]`;
        description = description ? description + branchInfo : branchInfo.trim();
      }

      const log = await db.updateLog.create({
        data: {
          version,
          title: parsed.title,
          description,
          changes: parsed.changes,
          commitHash: commit.sha,
          commitUrl: commit.html_url,
          author: commit.commit.author.name,
          date: new Date(commit.commit.author.date),
        },
      });

      logs.push(log);
    }

    res.json({
      msg: `Berhasil sync ${logs.length} update logs dari ${branches.length} branches (${skipped} skipped)`,
      logs,
      total: allCommits.length,
      synced: logs.length,
      skipped,
      branches: branches,
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

/**
 * Webhook endpoint untuk auto-sync saat push ke GitHub
 * Configure di GitHub: Settings > Webhooks > Add webhook
 * Payload URL: https://yourdomain.com/api/updatelog/webhook
 * Content type: application/json
 * Secret: (optional, bisa ditambahkan untuk security)
 */
export const webhookSync = async (req: Request, res: Response) => {
  try {
    // Verify webhook secret jika ada
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = (req.headers as any)["x-hub-signature-256"] as string | undefined;
      // TODO: Implement signature verification untuk production
    }

    const event = (req.headers as any)["x-github-event"] as string | undefined;
    
    // Hanya process push events
    if (event !== "push") {
      return res.status(StatusCodes.OK).json({ msg: "Event ignored" });
    }

    const payload = req.body as any;
    const commits = payload.commits || [];

    if (commits.length === 0) {
      return res.status(StatusCodes.OK).json({ msg: "No commits to sync" });
    }

    const repo = process.env.GITHUB_REPO || process.env.NEXT_PUBLIC_GITHUB_REPO || "JoshuaRVLS/JBlog";
    const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;

    if (!token) {
      console.error("GITHUB_TOKEN tidak dikonfigurasi untuk webhook");
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "GITHUB_TOKEN tidak dikonfigurasi",
      });
    }

    const logs = [];
    let skipped = 0;

    // Fetch full commit details dari GitHub API
    for (const commit of commits) {
      try {
        // Skip jika commit sudah ada
        const existing = await db.updateLog.findFirst({
          where: { commitHash: commit.id },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Fetch full commit details
        const commitResponse = await fetch(
          `https://api.github.com/repos/${repo}/commits/${commit.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!commitResponse.ok) {
          console.error(`Failed to fetch commit ${commit.id}`);
          continue;
        }

        const commitData = (await commitResponse.json()) as any;
        const message = commitData.commit.message;
        const parsed = parseCommitMessage(message);

        // Skip merge commits dan empty commits
        if (message.toLowerCase().startsWith("merge") || !parsed.title.trim()) {
          skipped++;
          continue;
        }

        // Generate version jika tidak ada di commit message
        const version = parsed.version || commit.id.substring(0, 7);

        const log = await db.updateLog.create({
          data: {
            version,
            title: parsed.title,
            description: parsed.description,
            changes: parsed.changes,
            commitHash: commit.id,
            commitUrl: commit.url,
            author: commitData.commit.author.name,
            date: new Date(commitData.commit.author.date),
          },
        });

        logs.push(log);
      } catch (error: any) {
        console.error(`Error processing commit ${commit.id}:`, error);
        continue;
      }
    }

    console.log(`Webhook sync: ${logs.length} logs created, ${skipped} skipped`);

    res.status(StatusCodes.OK).json({
      msg: `Berhasil sync ${logs.length} update logs dari webhook`,
      logs,
      synced: logs.length,
      skipped,
    });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error.message || "Gagal process webhook",
    });
  }
};

