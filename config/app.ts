import express from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { checkMaintenanceMode } from "../middleware/maintenance.middleware";
import UsersRoutes from "../routes/users.route";
import AuthRoutes from "../routes/auth.route";
import EmailRoutes from "../routes/email.route";
import PostsRoutes from "../routes/posts.route";
import ClapsRoutes from "../routes/claps.route";
import CommentsRoutes from "../routes/comments.route";
import TagsRoutes from "../routes/tags.route";
import AdminRoutes from "../routes/admin.route";
import UploadRoutes from "../routes/upload.route";
import ProfileRoutes from "../routes/profile.route";
import ReportRoutes from "../routes/report.route";
import SearchRoutes from "../routes/search.route";
import GroupChatRoutes from "../routes/groupchat.route";
import NotificationsRoutes from "../routes/notifications.route";
import BookmarksRoutes from "../routes/bookmarks.route";
import RepostsRoutes from "../routes/reposts.route";
import DirectMessagesRoutes from "../routes/directMessages.route";
import FeedRoutes from "../routes/feed.route";
import BroadcastRoutes from "../routes/broadcast.route";
import UpdateLogRoutes from "../routes/updatelog.route";
import EncryptionRoutes from "../routes/encryption.route";
import JPlusRoutes from "../routes/jplus.route";
import ReactionsRoutes from "../routes/reactions.route";
import CollectionsRoutes from "../routes/collections.route";
import AnalyticsRoutes from "../routes/analytics.route";

export function createApp(): express.Application {
  const app = express();

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
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"), {
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

  // Register all routes
  app.use("/api/users/", UsersRoutes);
  app.use("/api/auth/", AuthRoutes);
  app.use("/api/email/", EmailRoutes);
  app.use("/api/posts/", PostsRoutes);
  app.use("/api/claps/", ClapsRoutes);
  app.use("/api/comments/", CommentsRoutes);
  app.use("/api/tags/", TagsRoutes);
  app.use("/api/admin/", AdminRoutes);
  app.use("/api/upload/", UploadRoutes);
  app.use("/api/reports/", ReportRoutes);
  app.use("/api/profile/", ProfileRoutes);
  app.use("/api/search/", SearchRoutes);
  app.use("/api/groupchat/", GroupChatRoutes);
  app.use("/api/notifications/", NotificationsRoutes);
  app.use("/api/bookmarks/", BookmarksRoutes);
  app.use("/api/reposts/", RepostsRoutes);
  app.use("/api/direct-messages/", DirectMessagesRoutes);
  app.use("/api/feed/", FeedRoutes);
  app.use("/api/broadcast/", BroadcastRoutes);
  app.use("/api/updatelog/", UpdateLogRoutes);
  app.use("/api/encryption/", EncryptionRoutes);
  app.use("/api/jplus/", JPlusRoutes);
  app.use("/api/", ReactionsRoutes);
  app.use("/api/", CollectionsRoutes);
  app.use("/api/", AnalyticsRoutes);

  return app;
}

