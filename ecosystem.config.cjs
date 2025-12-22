module.exports = {
  apps: [
    {
      name: "jblog-backend",
      script: "npx",
      args: "tsx server.ts",
      interpreter: "none",
      instances: 4, // Use 4 instances (adjust based on CPU cores)
      exec_mode: "cluster", // Cluster mode untuk load balancing
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      wait_ready: true, // Tunggu sampai app ready sebelum consider sebagai healthy
      listen_timeout: 30000, // Timeout untuk wait_ready (30 detik untuk multiple instances)
      kill_timeout: 10000, // Waktu untuk graceful shutdown
      min_uptime: "10s", // Minimal uptime sebelum dianggap stable
      max_restarts: 5, // Reduced max restarts to prevent infinite loops
      restart_delay: 5000, // Increased delay antar restart
      env: {
        NODE_ENV: "production",
        ENABLE_CLUSTER: "true", // Enable Redis adapter untuk Socket.IO di cluster mode
      },
    },
  ],
};

