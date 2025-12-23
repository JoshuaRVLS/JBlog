import db from "../lib/db";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const cleanupUnverifiedAccounts = async (): Promise<void> => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - TWENTY_FOUR_HOURS_MS);

    const unverifiedUsers = await db.user.findMany({
      where: {
        isVerified: false,
        createdAt: {
          lt: twentyFourHoursAgo,
        },
        oauthProvider: null,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    if (unverifiedUsers.length > 0) {
      const userIds = unverifiedUsers.map((user) => user.id);

      await db.user.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });

      console.log(
        `[Cleanup] Deleted ${unverifiedUsers.length} unverified account(s) older than 24 hours`
      );
      
      for (const user of unverifiedUsers) {
        console.log(
          `[Cleanup] Deleted unverified user: ${user.email} (created: ${user.createdAt.toISOString()})`
        );
      }
    }

    const expiredVerificationCodes = await db.verificationCode.findMany({
      where: {
        OR: [
          {
            expiredAt: {
              lt: now,
            },
          },
          {
            createdAt: {
              lt: twentyFourHoursAgo,
            },
          },
        ],
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        expiredAt: true,
      },
    });

    if (expiredVerificationCodes.length > 0) {
      const codeIds = expiredVerificationCodes.map((code) => code.id);

      await db.verificationCode.deleteMany({
        where: {
          id: {
            in: codeIds,
          },
        },
      });

      console.log(
        `[Cleanup] Deleted ${expiredVerificationCodes.length} expired verification code(s)`
      );
    }

    if (unverifiedUsers.length === 0 && expiredVerificationCodes.length === 0) {
      console.log(`[Cleanup] No unverified accounts or expired tokens to clean up`);
    }
  } catch (error) {
    console.error("[Cleanup] Error cleaning up unverified accounts:", error);
  }
};

export const initCleanupUnverifiedAccountsJob = (): void => {
  const INTERVAL_MS = 60 * 60 * 1000;

  setInterval(cleanupUnverifiedAccounts, INTERVAL_MS);

  setImmediate(() => {
    cleanupUnverifiedAccounts().catch((err) => {
      console.error(
        "[Cleanup] Error running cleanup on startup:",
        err
      );
    });
  });

  console.log(
    `[Cleanup] Initialized cleanup job - runs every ${INTERVAL_MS / 1000 / 60} minutes`
  );
};

