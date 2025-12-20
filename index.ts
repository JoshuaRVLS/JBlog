import "dotenv/config";
import express from "express";
import cors from "cors";
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
import { setIO } from "./lib/socket";
import { getRedisClient, getRedisSubscriber } from "./lib/redis";

const app = express();

app.set("trust proxy", 1);
app.use(
  cors({
    credentials: true,
    origin: process.env.NODE_ENV === "production" && process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));
// Custom morgan format dengan bahasa Indonesia
morgan.token("status-indo", (req: any, res: any) => {
  const status = res.statusCode;
  if (status >= 500) return "❌ Server Error";
  if (status >= 400) return "⚠️ Client Error";
  if (status >= 300) return "↪️ Redirect";
  return "✅ Success";
});

app.use(
  morgan(
    ":method :url :status-indo - :response-time ms",
    {
      skip: (req) => req.url?.includes("_next") || req.url?.includes("favicon"),
    }
  )
);

// Serve static files untuk uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// Cluster info endpoint (for verification)
app.get("/api/cluster-info", (req, res) => {
  const os = require("os");
  res.json({
    clusterMode: process.env.ENABLE_CLUSTER === "true",
    instanceId: process.env.INSTANCE_ID || "single",
    pid: process.pid,
    cpuCount: os.cpus().length,
    nodeVersion: process.version,
    redisEnabled: process.env.ENABLE_CLUSTER === "true",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    instanceId: process.env.INSTANCE_ID || "single",
    pid: process.pid,
    timestamp: new Date().toISOString(),
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" && process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  },
});

// Setup Redis adapter for cluster mode (after io is created)
// Note: This is async but doesn't block server startup
if (process.env.ENABLE_CLUSTER === "true") {
  (async () => {
    try {
      const pubClient = getRedisClient();
      const subClient = getRedisSubscriber();
      
      // ioredis auto-connects, but we can wait for ready
      await Promise.all([
        pubClient.ping().catch(() => {}),
        subClient.ping().catch(() => {}),
      ]);
      
      io.adapter(createAdapter(pubClient, subClient));
      console.log("✅ Socket.IO Redis Adapter enabled for cluster mode");
    } catch (error) {
      console.error("❌ Failed to setup Redis adapter, falling back to in-memory:", error);
      console.warn("⚠️  Socket.IO will work but won't share state across workers");
      console.warn("⚠️  Make sure Redis is running and ENABLE_CLUSTER=true in .env");
      // Don't crash - continue without Redis adapter
    }
  })();
} else {
  console.log("ℹ️  Socket.IO running in single-instance mode (no Redis adapter)");
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

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.data.user.name} (${socket.data.userId})`);
  
  // Join user's personal notification room
  socket.join(`user:${socket.data.userId}`);

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
      console.log(`✅ User ${socket.data.user.name} joined group ${groupId}`);

      // Notify others in the group
      socket.to(`group:${groupId}`).emit("user-joined", {
        userId: socket.data.userId,
        userName: socket.data.user.name,
      });
    } catch (error: any) {
      console.error("❌ Error joining group:", error);
      socket.emit("error", { msg: "Gagal join group" });
    }
  });

  // Leave group chat room
  socket.on("leave-group", (groupId: string) => {
    socket.leave(`group:${groupId}`);
    console.log(`✅ User ${socket.data.user.name} left group ${groupId}`);
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
      console.error("❌ Error handling typing:", error);
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
      console.error("❌ Error handling stop typing:", error);
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
          mentions.push(match[1]);
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

      // Save message to database
      const message = await db.message.create({
        data: {
          content: encryptedContent ? null : (content?.trim() || ""),
          encryptedContent: encryptedContent || null,
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

      // Create notifications for mentioned users
      for (const mentionedUserId of mentionedUserIds) {
        await createNotification({
          type: "mention",
          userId: mentionedUserId,
          actorId: socket.data.userId,
          messageId: message.id,
          groupChatId: groupId,
        });
        
        // Emit real-time notification
        io.to(`user:${mentionedUserId}`).emit("new-notification", {
          type: "mention",
          message: `${socket.data.user.name} mentioned you in ${groupChat.name}`,
        });
      }

      // Update group chat updatedAt
      await db.groupChat.update({
        where: { id: groupId },
        data: { updatedAt: new Date() },
      });

      // Broadcast message to all users in the group
      io.to(`group:${groupId}`).emit("new-message", message);

      console.log(`✅ Message sent in group ${groupId} by ${socket.data.user.name} (type: ${type})`);
    } catch (error: any) {
      console.error("❌ Error sending message:", error);
      socket.emit("error", { msg: "Gagal mengirim pesan" });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.data.user.name}`);
  });
});

const PORT = process.env.PORT || 8000;

// PM2 cluster mode support - signal ready after server starts
httpServer.listen(PORT, () => {
  const instanceId = process.env.INSTANCE_ID || "single";
  console.log(`🚀 Server berjalan di http://localhost:${PORT} (Instance: ${instanceId})`);
  console.log(`📝 API tersedia di http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO ready ${process.env.ENABLE_CLUSTER === "true" ? "(Cluster Mode)" : "(Single Instance)"}`);
  
  // Signal PM2 that the app is ready (for wait_ready option)
  // In cluster mode, process.send is available
  if (typeof process.send === "function") {
    try {
      process.send("ready");
      console.log("✅ PM2 ready signal sent");
    } catch (error) {
      console.warn("⚠️  Could not send PM2 ready signal:", error);
    }
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  httpServer.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  httpServer.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});
