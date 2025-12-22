import Redis from "ioredis";

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let redisEnabled = false;

// Check if Redis should be enabled
export const isRedisEnabled = (): boolean => {
  return process.env.ENABLE_CLUSTER === "true";
};

export const getRedisClient = (): Redis | null => {
  if (!isRedisEnabled()) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || "0"),
      retryStrategy: (times) => {
        // Stop retrying after 3 attempts
        if (times > 3) {
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 1, // Reduce retries to prevent spam
      enableReadyCheck: true,
      lazyConnect: true, // Connect manual, jangan auto-connect saat startup
      connectTimeout: 5000, // Timeout 5 detik
      showFriendlyErrorStack: false,
    });

    // Suppress connection errors - only log once
    let errorLogged = false;
    redisClient.on("error", (err) => {
      if (!errorLogged && err.message.includes("ECONNREFUSED")) {
        console.warn("⚠️  Redis tidak tersedia. Socket.IO akan berjalan tanpa Redis adapter.");
        console.warn("   Untuk development lokal, ini normal. Install Redis jika diperlukan.");
        errorLogged = true;
      }
      // Don't spam errors
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis Client Connected");
      redisEnabled = true;
    });

    redisClient.on("ready", () => {
      console.log("✅ Redis Client Ready");
      redisEnabled = true;
    });
  }

  return redisClient;
};

export const getRedisSubscriber = (): Redis | null => {
  if (!isRedisEnabled()) {
    return null;
  }

  if (!redisSubscriber) {
    redisSubscriber = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || "0"),
      retryStrategy: (times) => {
        // Stop retrying after 3 attempts
        if (times > 3) {
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 1, // Reduce retries to prevent spam
      enableReadyCheck: true,
      lazyConnect: true, // Connect manual, jangan auto-connect saat startup
      connectTimeout: 5000, // Timeout 5 detik
      showFriendlyErrorStack: false,
    });

    // Suppress connection errors - only log once
    let errorLogged = false;
    redisSubscriber.on("error", (err) => {
      if (!errorLogged && err.message.includes("ECONNREFUSED")) {
        // Already logged by client, don't duplicate
        errorLogged = true;
      }
      // Don't spam errors
    });

    redisSubscriber.on("connect", () => {
      console.log("✅ Redis Subscriber Connected");
      redisEnabled = true;
    });

    redisSubscriber.on("ready", () => {
      console.log("✅ Redis Subscriber Ready");
      redisEnabled = true;
    });
  }

  return redisSubscriber;
};

export const closeRedisConnections = async () => {
  if (redisClient) {
    try {
    await redisClient.quit();
    } catch (error) {
      // Ignore errors when closing
    }
    redisClient = null;
  }
  if (redisSubscriber) {
    try {
    await redisSubscriber.quit();
    } catch (error) {
      // Ignore errors when closing
    }
    redisSubscriber = null;
  }
};

