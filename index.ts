import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import UsersRoutes from "./routes/users.route";
import AuthRoutes from "./routes/auth.route";
import EmailRoutes from "./routes/email.route";
import PostsRoutes from "./routes/posts.route";
import ClapsRoutes from "./routes/claps.route";
import CommentsRoutes from "./routes/comments.route";
import TagsRoutes from "./routes/tags.route";
import AdminRoutes from "./routes/admin.route";
import UploadRoutes from "./routes/upload.route";
import ProfileRoutes from "./routes/profile.route";
import ReportRoutes from "./routes/report.route";
import SearchRoutes from "./routes/search.route";
import GroupChatRoutes from "./routes/groupchat.route";
import NotificationsRoutes from "./routes/notifications.route";
import BookmarksRoutes from "./routes/bookmarks.route";
import RepostsRoutes from "./routes/reposts.route";
import DirectMessagesRoutes from "./routes/directMessages.route";
import FeedRoutes from "./routes/feed.route";
import BroadcastRoutes from "./routes/broadcast.route";
import UpdateLogRoutes from "./routes/updatelog.route";
import EncryptionRoutes from "./routes/encryption.route";
import JPlusRoutes from "./routes/jplus.route";
import ReactionsRoutes from "./routes/reactions.route";
import CollectionsRoutes from "./routes/collections.route";
import AnalyticsRoutes from "./routes/analytics.route";
import db from "./lib/db";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { verify } from "./lib/jwt";
import { createNotification } from "./controllers/notifications.controller";
import { setIO, getIO } from "./lib/socket";
import { getRedisClient, getRedisSubscriber, closeRedisConnections } from "./lib/redis";
import { checkMaintenanceMode } from "./middleware/maintenance.middleware";
import os from "os";

const app = express();

app.set("trust proxy", 1);

// Enable HTTP compression (gzip/brotli) - CRITICAL for performance
// TEMPORARILY DISABLED: Testing if this causes crash loops
// app.use(
//   compression({
//     level: 6, // Balance between compression and CPU (1-9, 6 is optimal)
//     threshold: 1024, // Only compress responses > 1KB
//   })
// );

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
app.use(express.json({ limit: "50mb" })); // Increased back to handle large uploads
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
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "1y", // Cache static files for 1 year
    etag: true,
    lastModified: true,
  })
);

// Add cache headers for public GET requests
app.use((req, res, next) => {
  // Only cache GET requests that are public
  if (req.method === "GET" && !req.path.includes("/admin") && !req.path.includes("/auth") && !req.userId) {
    // Cache public API responses for 5 minutes
    if (req.path.startsWith("/api/tags") || req.path.startsWith("/api/posts") && !req.query.authorId) {
      res.set("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=60");
    }
  }
  next();
});

// Maintenance mode check (before all routes except admin/auth)
app.use(checkMaintenanceMode);

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

// Function to publish scheduled posts
const publishScheduledPosts = async () => {
  try {
    const now = new Date();
    const scheduledPosts = await db.post.findMany({
      where: {
        scheduledAt: {
          lte: now,
        },
        published: false,
      },
    });

    for (const post of scheduledPosts) {
      await db.post.update({
        where: { id: post.id },
        data: {
          published: true,
          scheduledAt: null, // Clear scheduledAt after publishing
        },
      });
      console.log(`Published scheduled post: ${post.id} - ${post.title}`);
    }

    if (scheduledPosts.length > 0) {
      console.log(`Published ${scheduledPosts.length} scheduled post(s)`);
    }
  } catch (error) {
    console.error("Error publishing scheduled posts:", error);
  }
};

// Check for scheduled posts every minute
setInterval(publishScheduledPosts, 60 * 1000);

// Publish scheduled posts on server start (non-blocking)
// Jangan block startup, jalankan di background
setImmediate(() => {
  publishScheduledPosts().catch((err) => {
    console.error("Error publishing scheduled posts on startup:", err);
  });
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

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.IO with optimized settings for ultra-low latency
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" && process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  },
  // Optimize for real-time messaging (like WhatsApp)
  transports: ["websocket"], // Force websocket only (lowest latency)
  upgradeTimeout: 10000, // 10s timeout for upgrade
  pingTimeout: 60000, // 60s ping timeout
  pingInterval: 25000, // 25s ping interval
  maxHttpBufferSize: 1e8, // 100MB for media
  allowEIO3: false, // Disable old engine.io versions
  // Enable compression for faster transfers
  perMessageDeflate: {
    zlibDeflateOptions: {
      level: 3, // Balance between speed and compression
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    threshold: 1024, // Only compress messages > 1KB
  },
});

// Setup Redis adapter untuk cluster mode (non-blocking)
// Tanpa Redis: Socket.IO hanya work dalam instance yang sama (user di instance berbeda tidak bisa saling kirim pesan)
// Dengan Redis: Socket.IO bisa share state antar semua instance (recommended untuk production)
if (process.env.ENABLE_CLUSTER === "true") {
  // Setup Redis secara async, jangan block server startup
  setImmediate(async () => {
    try {
      const pubClient = getRedisClient();
      const subClient = getRedisSubscriber();
      
      // Skip jika Redis tidak enabled
      if (!pubClient || !subClient) {
        console.log("ℹ️  Socket.IO running tanpa Redis adapter (ENABLE_CLUSTER=false atau Redis tidak tersedia)");
        return;
      }
      
      // Coba ping Redis dengan timeout (lazyConnect akan auto-connect saat ping)
      await Promise.race([
        Promise.all([
          pubClient.ping().catch(() => {
            throw new Error("Redis pub client connection failed");
          }),
          subClient.ping().catch(() => {
            throw new Error("Redis sub client connection failed");
          }),
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Redis timeout")), 5000))
      ]);
      
      io.adapter(createAdapter(pubClient, subClient));
      console.log("✅ Socket.IO Redis Adapter enabled - semua instance bisa share state");
    } catch (error) {
      // Silently fail - Redis is optional for local development
      console.log("ℹ️  Socket.IO running tanpa Redis adapter");
      console.log("   (Redis tidak tersedia atau connection timeout)");
      console.log("   Untuk development lokal, ini normal. Install Redis jika diperlukan untuk production.");
    }
  });
} else {
  console.log("ℹ️  Socket.IO running tanpa Redis adapter");
  console.log("   (ENABLE_CLUSTER tidak di-set ke 'true')");
}

// Make Socket.IO instance accessible from other modules
setIO(io);

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const userId = await verify(token);
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, profilePicture: true },
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.data.userId = user.id;
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
});

// Handle koneksi socket
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.data.user.name} (${socket.data.userId})`);
  console.log(`Socket ID: ${socket.id}, Joined room: user:${socket.data.userId}`);
  
  // Join room untuk notifikasi user
  socket.join(`user:${socket.data.userId}`);
  console.log(`User ${socket.data.userId} joined room user:${socket.data.userId}`);

  // Join group chat room
  socket.on("join-group", async (groupId: string) => {
    try {
      // Verify user is member of the group
      const member = await db.groupChatMember.findUnique({
        where: {
          groupChatId_userId: {
            groupChatId: groupId,
            userId: socket.data.userId,
          },
        },
      });

      const groupChat = await db.groupChat.findUnique({
        where: { id: groupId },
      });

      if (!groupChat) {
        socket.emit("error", { msg: "Group chat tidak ditemukan" });
        return;
      }

      if (!groupChat.isPublic && !member) {
        socket.emit("error", { msg: "Kamu bukan member group ini" });
        return;
      }

      socket.join(`group:${groupId}`);
      console.log(`User ${socket.data.user.name} joined group ${groupId}`);

      // Notify others in the group
      socket.to(`group:${groupId}`).emit("user-joined", {
        userId: socket.data.userId,
        userName: socket.data.user.name,
      });
    } catch (error: any) {
      console.error("Error joining group:", error);
      socket.emit("error", { msg: "Gagal join group" });
    }
  });

  // Leave group chat room
  socket.on("leave-group", (groupId: string) => {
    socket.leave(`group:${groupId}`);
    console.log(`User ${socket.data.user.name} left group ${groupId}`);
  });

  // Typing indicator
  socket.on("typing", async (data: { groupId: string }) => {
    try {
      const { groupId } = data;
      
      // Verify user is member of the group
      const member = await db.groupChatMember.findUnique({
        where: {
          groupChatId_userId: {
            groupChatId: groupId,
            userId: socket.data.userId,
          },
        },
      });

      const groupChat = await db.groupChat.findUnique({
        where: { id: groupId },
      });

      if (!groupChat) {
        return;
      }

      if (!groupChat.isPublic && !member) {
        return;
      }

      // Broadcast typing event to other users in the group
      socket.to(`group:${groupId}`).emit("user-typing", {
        userId: socket.data.userId,
        userName: socket.data.user.name,
      });
    } catch (error: any) {
      console.error("Error handling typing:", error);
    }
  });

  // Stop typing indicator
  socket.on("stop-typing", async (data: { groupId: string }) => {
    try {
      const { groupId } = data;
      
      // Verify user is member of the group
      const member = await db.groupChatMember.findUnique({
        where: {
          groupChatId_userId: {
            groupChatId: groupId,
            userId: socket.data.userId,
          },
        },
      });

      const groupChat = await db.groupChat.findUnique({
        where: { id: groupId },
      });

      if (!groupChat) {
        return;
      }

      if (!groupChat.isPublic && !member) {
        return;
      }

      // Broadcast stop typing event to other users in the group
      socket.to(`group:${groupId}`).emit("user-stop-typing", {
        userId: socket.data.userId,
      });
    } catch (error: any) {
      console.error("Error handling stop typing:", error);
    }
  });

  // Send message
  socket.on("send-message", async (data: { 
    groupId: string; 
    content?: string;
    encryptedContent?: string;
    encryptionKeyId?: string;
    type?: string;
    mediaUrl?: string;
    mediaThumbnail?: string;
  }) => {
    try {
      const { groupId, content, encryptedContent, encryptionKeyId, type = "text", mediaUrl, mediaThumbnail } = data;

      // For text messages, either content or encryptedContent is required
      if (type === "text" && (!content || content.trim().length === 0) && !encryptedContent) {
        socket.emit("error", { msg: "Pesan tidak boleh kosong" });
        return;
      }

      // For media messages, mediaUrl is required
      if (type !== "text" && !mediaUrl) {
        socket.emit("error", { msg: "Media URL tidak ditemukan" });
        return;
      }

      // Verify user is member
      const member = await db.groupChatMember.findUnique({
        where: {
          groupChatId_userId: {
            groupChatId: groupId,
            userId: socket.data.userId,
          },
        },
      });

      const groupChat = await db.groupChat.findUnique({
        where: { id: groupId },
      });

      if (!groupChat) {
        socket.emit("error", { msg: "Group chat tidak ditemukan" });
        return;
      }

      if (!groupChat.isPublic && !member) {
        socket.emit("error", { msg: "Kamu bukan member group ini" });
        return;
      }

      // Parse mentions from content (@username) - only for text messages
      const mentionRegex = /@(\w+)/g;
      const mentions: string[] = [];
      if (type === "text" && content) {
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
          if (match[1]) {
            mentions.push(match[1]);
          }
        }
      }

      // Get all group members to match mentions
      const groupMembers = await db.groupChatMember.findMany({
        where: { groupChatId: groupId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Find mentioned users
      const mentionedUserIds: string[] = [];
      for (const mention of mentions) {
        const member = groupMembers.find(
          (m) => m.user.name.toLowerCase() === mention.toLowerCase()
        );
        if (member && member.userId !== socket.data.userId) {
          mentionedUserIds.push(member.userId);
        }
      }

      // Kirim pesan langsung ke semua user sebelum save ke database (biar lebih cepat)
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMessage = {
        id: tempMessageId,
        content: encryptedContent ? "" : (content?.trim() || ""),
        encryptedContent: encryptedContent ?? null,
        encryptionKeyId: encryptionKeyId || null,
        type: type,
        mediaUrl: mediaUrl || null,
        mediaThumbnail: mediaThumbnail || null,
        groupChatId: groupId,
        userId: socket.data.userId,
        createdAt: new Date().toISOString(),
        user: {
          id: socket.data.userId,
          name: socket.data.user.name,
          profilePicture: socket.data.user.profilePicture,
        },
        reads: [],
      };

      // Broadcast pesan ke semua member group
      io.to(`group:${groupId}`).emit("new-message", optimisticMessage);

      // Save ke database
      const message = await db.message.create({
        data: {
          content: encryptedContent ? "" : (content?.trim() || ""),
          encryptedContent: encryptedContent ?? null,
          encryptionKeyId: encryptionKeyId || null,
          type: type,
          mediaUrl: mediaUrl || null,
          mediaThumbnail: mediaThumbnail || null,
          groupChatId: groupId,
          userId: socket.data.userId,
          mentions: {
            create: mentionedUserIds.map((mentionedUserId) => ({
              mentionedUserId,
            })),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
        },
      });

      // Update pesan dengan ID yang beneran dari database
      io.to(`group:${groupId}`).emit("message-updated", {
        tempId: tempMessageId,
        realId: message.id,
        message,
      });

      // Buat notifikasi untuk user yang di-mention
      Promise.all(
        mentionedUserIds.map(async (mentionedUserId) => {
          try {
            const notification = await createNotification({
              type: "mention",
              userId: mentionedUserId,
              actorId: socket.data.userId,
              messageId: message.id,
              groupChatId: groupId,
            });
            
            // Kirim notifikasi real-time
            io.to(`user:${mentionedUserId}`).emit("new-notification", notification);
          } catch (err) {
            console.error("Error creating mention notification:", err);
          }
        })
      ).catch((err) => console.error("Error in notification creation:", err));

      // Update timestamp group chat
      db.groupChat.update({
        where: { id: groupId },
        data: { updatedAt: new Date() },
      }).catch((err) => console.error("Error updating group chat:", err));

      console.log(`Message sent in group ${groupId} by ${socket.data.user.name} (type: ${type})`);
    } catch (error: any) {
      console.error("Error sending message:", error);
      socket.emit("error", { msg: "Gagal mengirim pesan" });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.data.user.name}`);
  });
});

const PORT = process.env.PORT || 8000;
const instanceId = process.env.NODE_APP_INSTANCE || process.env.INSTANCE_ID || "single";

// Log startup info
console.log(`[Instance ${instanceId}] Starting server on port ${PORT}...`);
console.log(`[Instance ${instanceId}] PM2 cluster mode: ${process.env.ENABLE_CLUSTER === "true" ? "enabled" : "disabled"}`);
console.log(`[Instance ${instanceId}] process.send available: ${typeof process.send === "function"}`);

// PM2 cluster mode support - signal ready after server starts
try {
httpServer.listen(PORT, () => {
    const isCluster = process.env.ENABLE_CLUSTER === "true";
    
    console.log(`[Instance ${instanceId}] Server berjalan di http://localhost:${PORT}`);
    console.log(`[Instance ${instanceId}] API tersedia di http://localhost:${PORT}/api`);
    console.log(`[Instance ${instanceId}] Socket.IO ready ${isCluster ? "(Cluster Mode)" : "(Single Instance)"}`);
  
    // Kirim signal ke PM2 kalau app sudah ready (untuk wait_ready)
    // IMPORTANT: Kirim signal segera setelah server listen, jangan tunggu apapun
  if (typeof process.send === "function") {
    try {
      process.send("ready");
        console.log(`[Instance ${instanceId}] PM2 ready signal sent`);
    } catch (error) {
        console.error(`[Instance ${instanceId}] Could not send PM2 ready signal:`, error);
    }
    } else {
      console.warn(`[Instance ${instanceId}] process.send tidak tersedia - mungkin bukan cluster mode`);
    }
  });

  // Handle error saat listen
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    console.error(`[Instance ${instanceId}] Server listen error:`, err);
    if (err.code === "EADDRINUSE") {
      console.error(`[Instance ${instanceId}] Port ${PORT} sudah digunakan`);
    }
    process.exit(1);
  });
} catch (error) {
  console.error(`[Instance ${instanceId}] Failed to start server:`, error);
  process.exit(1);
}

// Shutdown yang proper untuk cluster mode
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  
  // Tutup HTTP server (stop accepting new connections)
  httpServer.close(async () => {
    console.log("HTTP server closed");
    
    try {
      // Tutup Socket.IO
      const io = getIO();
      if (io) {
        io.close();
        console.log("Socket.IO closed");
      }
      
      // Tutup Redis connections
      await closeRedisConnections();
      console.log("Redis connections closed");
      
      // Tutup database connections (sudah di-handle di db.ts tapi kita pastikan)
      await db.$disconnect();
      console.log("Database connections closed");
      
      console.log("Graceful shutdown completed");
    process.exit(0);
    } catch (error) {
      console.error("Error during graceful shutdown:", error);
      process.exit(1);
    }
  });
  
  // Force exit setelah 10 detik kalau masih belum selesai
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

