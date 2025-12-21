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
      listen_timeout: 10000, // Timeout untuk wait_ready
      kill_timeout: 5000, // Waktu untuk graceful shutdown
      env: {
        NODE_ENV: "production",
        ENABLE_CLUSTER: "true", // Enable Redis adapter untuk Socket.IO di cluster mode
      },
    },
  ],
};

