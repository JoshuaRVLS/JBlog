import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedisClient, getRedisSubscriber } from "../lib/redis";
import { setIO } from "../lib/socket";
import { verify } from "../lib/jwt";
import db from "../lib/db";
import { setupGroupChatHandlers } from "./handlers/groupChat.handler";
import { setupDirectMessageHandlers } from "./handlers/directMessages.handler";

// Setup Socket.IO with optimized settings for ultra-low latency
export function setupSocketIO(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" && process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true,
    },
    // Optimize for real-time messaging (like WhatsApp) - ULTRA LOW LATENCY
    transports: ["websocket"], // Force websocket only (lowest latency)
    upgradeTimeout: 5000, // Reduced from 10s to 5s for faster connection
    pingTimeout: 20000, // Reduced from 60s to 20s for faster detection of disconnects
    pingInterval: 10000, // Reduced from 25s to 10s for more frequent keepalive
    maxHttpBufferSize: 1e8, // 100MB for media
    allowEIO3: false, // Disable old engine.io versions
    // Enable compression for faster transfers
    perMessageDeflate: {
      zlibDeflateOptions: {
        level: 1, // Reduced from 3 to 1 for faster compression (speed > size)
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024,
      },
      threshold: 1024, // Only compress messages > 1KB
    },
    // Connection state recovery for better reliability
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  // Setup Redis adapter untuk cluster mode (non-blocking)
  if (process.env.ENABLE_CLUSTER === "true") {
    setImmediate(async () => {
      try {
        const pubClient = getRedisClient();
        const subClient = getRedisSubscriber();
        
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

  // Setup socket handlers
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.data.user.name} (${socket.data.userId})`);
    console.log(`Socket ID: ${socket.id}, Joined room: user:${socket.data.userId}`);
    
    // Join room untuk notifikasi user
    socket.join(`user:${socket.data.userId}`);
    console.log(`User ${socket.data.userId} joined room user:${socket.data.userId}`);

    // Setup handlers
    setupGroupChatHandlers(socket, io);
    setupDirectMessageHandlers(socket, io);

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.data.user.name}`);
    });
  });

  return io;
}

