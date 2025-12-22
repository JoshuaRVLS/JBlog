import express from "express";
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

export function createApp(): express.Application {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    compression({
      level: 6,
      threshold: 1024,
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
      maxAge: 86400,
    })
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(cookieParser(process.env.COOKIE_SECRET));

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

  app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"), {
      maxAge: "1y",
      etag: true,
      lastModified: true,
    })
  );

  app.use((req, res, next) => {
    const authReq = req as typeof req & { userId?: string };
    if (req.method === "GET" && !req.path.includes("/admin") && !req.path.includes("/auth") && !authReq.userId) {
      if (req.path.startsWith("/api/tags") || req.path.startsWith("/api/posts") && !req.query.authorId) {
        res.set("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=60");
      }
    }
    next();
  });

  app.use(checkMaintenanceMode);

  return app;
}
