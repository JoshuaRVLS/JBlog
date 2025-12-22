import { type Server as HttpServer } from "http";
import { getIO } from "../lib/socket";
import { closeRedisConnections } from "../lib/redis";
import db from "../lib/db";

export function setupGracefulShutdown(httpServer: HttpServer) {
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
}

