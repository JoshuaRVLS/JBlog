module.exports = {
  apps: [
    {
      name: "jblog-backend",
      script: "npx",
      args: "tsx index.ts",
      interpreter: "none",
      instances: "max", // Jalankan di semua CPU yang tersedia
      exec_mode: "cluster", // Cluster mode untuk load balancing
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      wait_ready: true, // Tunggu sampai app ready sebelum consider sebagai healthy
      listen_timeout: 30000, // Timeout untuk wait_ready (30 detik untuk multiple instances)
      kill_timeout: 10000, // Waktu untuk graceful shutdown
      min_uptime: "10s", // Minimal uptime sebelum dianggap stable
      max_restarts: 10, // Maksimal restart attempts
      restart_delay: 4000, // Delay antar restart
      env: {
        NODE_ENV: "production",
        ENABLE_CLUSTER: "true", // Enable Redis adapter untuk Socket.IO di cluster mode
      },
    },
  ],
};

