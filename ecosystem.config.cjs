module.exports = {
  apps: [
    {
      name: "jblog-backend",
      script: "./index.ts",
      interpreter: "npx",
      interpreter_args: "tsx",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 8000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 8000,
      },
      // Auto restart on crash
      autorestart: true,
      // Watch for file changes (only in development)
      watch: process.env.NODE_ENV === "development",
      ignore_watch: ["node_modules", "uploads", "*.log"],
      // Max memory before restart (1GB)
      max_memory_restart: "1G",
      // Logging
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Advanced settings
      min_uptime: "10s",
      max_restarts: 10,
      // Cluster settings
      instance_var: "INSTANCE_ID",
    },
  ],
};

