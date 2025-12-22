import "dotenv/config";
import { createServer } from "http";
import { createApp } from "./config/app";
import { setupRoutes } from "./config/routes";
import { setupSocketIO } from "./config/socket";
import { initScheduledPostsJob } from "./jobs/scheduledPosts";
import { getIO } from "./lib/socket";
import { closeRedisConnections } from "./lib/redis";
import db from "./lib/db";

// Create Express app
const app = createApp();

// Setup routes (health, cluster-info)
setupRoutes(app);

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.IO
const io = setupSocketIO(httpServer);

// Initialize scheduled posts job
initScheduledPostsJob();

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
