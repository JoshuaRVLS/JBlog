module.exports = {
  apps: [
    {
      name: "jblog-backend",
      script: "npx",
      args: "tsx index.ts",
      interpreter: "none",
      instances: 1, // Single instance for debugging
      exec_mode: "fork", // Fork mode instead of cluster for debugging
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
        ENABLE_CLUSTER: "false", // Disabled for single instance debugging
      },
    },
  ],
};

