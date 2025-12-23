import express from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import os from "os";
import { checkMaintenanceMode } from "./middleware/maintenance.middleware";
import { setupRoutes } from "./routes";
import { setupSecurityHeaders } from "./middleware/security.middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createApp(): express.Application {
  const app = express();

  app.set("trust proxy", 1);

  setupSecurityHeaders(app);

  // Enable HTTP compression (gzip/brotli) - CRITICAL for performance
  app.use(
    compression({
      level: 6, // Balance between compression and CPU (1-9, 6 is optimal)
      threshold: 1024, // Only compress responses > 1KB
    })
  );

  app.use(
    cors({
      credentials: true,
      origin: process.env.NODE_ENV === "production" && process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["Content-Length", "Content-Type"],
      maxAge: 86400, // 24 hours
    })
  );

  // JSON parsing with reasonable limit
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // Custom morgan format dengan bahasa Indonesia
  morgan.token("status-indo", (req: any, res: any) => {
    const status = res.statusCode;
    if (status >= 500) return "Server Error";
    if (status >= 400) return "Client Error";
    if (status >= 300) return "Redirect";
    return "Success";
  });

  app.use(
    morgan(
      ":method :url :status-indo - :response-time ms",
      {
        skip: (req) => req.url?.includes("_next") || req.url?.includes("favicon"),
      }
    )
  );

  // Serve static files untuk uploads with caching
  app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"), {
      maxAge: "1y", // Cache static files for 1 year
      etag: true,
      lastModified: true,
    })
  );

  // Add cache headers for public GET requests
  app.use((req, res, next) => {
    // Only cache GET requests that are public
    // Use type assertion to access userId (may be set by auth middleware)
    const authReq = req as typeof req & { userId?: string };
    if (req.method === "GET" && !req.path.includes("/admin") && !req.path.includes("/auth") && !authReq.userId) {
      // Cache public API responses for 5 minutes
      if (req.path.startsWith("/api/tags") || req.path.startsWith("/api/posts") && !req.query.authorId) {
        res.set("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=60");
      }
    }
    next();
  });

  // Maintenance mode check (before all routes except admin/auth)
  app.use(checkMaintenanceMode);

  // Setup routes
  setupRoutes(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    try {
      res.json({
        status: "ok",
        instanceId: process.env.NODE_APP_INSTANCE || process.env.INSTANCE_ID || "single",
        pid: process.pid,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in health endpoint:", error);
      res.status(500).json({ error: "Failed to get health status" });
    }
  });

  // Cluster info endpoint (for verification)
  app.get("/api/cluster-info", (req, res) => {
    try {
      const instanceId = process.env.NODE_APP_INSTANCE || process.env.INSTANCE_ID || "single";
      const memUsage = process.memoryUsage();
      
      res.json({
        clusterMode: process.env.ENABLE_CLUSTER === "true",
        instanceId: instanceId,
        pid: process.pid,
        cpuCount: os.cpus().length,
        nodeVersion: process.version,
        redisEnabled: process.env.ENABLE_CLUSTER === "true",
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        },
        uptime: `${Math.round(process.uptime())}s`,
        timestamp: new Date().toISOString(),
      });
      
      // Log untuk tracking
      console.log(`[Instance ${instanceId}] Cluster info requested - Memory: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    } catch (error) {
      console.error("Error in cluster-info endpoint:", error);
      res.status(500).json({ error: "Failed to get cluster info" });
    }
  });

  return app;
}

