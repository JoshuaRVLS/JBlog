import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { checkMaintenanceMode } from "../middleware/maintenance.middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function setupMiddleware(app: express.Application) {
  app.set("trust proxy", 1);

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
    express.static(path.join(__dirname, "../uploads"), {
      maxAge: "1y", // Cache static files for 1 year
      etag: true,
      lastModified: true,
    })
  );

  // Add cache headers for public GET requests
  app.use((req: Request, res: Response, next: NextFunction) => {
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
}

