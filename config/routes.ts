import type { Express } from "express";
import os from "os";

export function setupRoutes(app: Express): void {
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
}

