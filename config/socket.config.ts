import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedisClient, getRedisSubscriber } from "../lib/redis";

export function createSocketIO(httpServer: any): Server {
  // Setup Socket.IO with optimized settings for ultra-low latency (WhatsApp-like)
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
    pingTimeout: 20000, // Reduced from 60s to 20s for faster detection of dead connections
    pingInterval: 10000, // Reduced from 25s to 10s for more frequent heartbeat
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
    connectTimeout: 5000, // 5s connection timeout
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
        
        // Coba ping Redis dengan timeout
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
        console.log("ℹ️  Socket.IO running tanpa Redis adapter");
        console.log("   (Redis tidak tersedia atau connection timeout)");
      }
    });
  } else {
    console.log("ℹ️  Socket.IO running tanpa Redis adapter");
    console.log("   (ENABLE_CLUSTER tidak di-set ke 'true')");
  }

  return io;
}

