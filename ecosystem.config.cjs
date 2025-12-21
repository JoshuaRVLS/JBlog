const path = require("path");

module.exports = {
  apps: [
    {
      name: "jblog-frontend",
      script: "npm",
      args: "run start",
      cwd: path.join(__dirname),
      instances: 1, // Next.js biasanya cukup 1 instance, atau pakai "max" kalau traffic tinggi
      exec_mode: "fork", // Fork mode untuk Next.js (cluster mode tidak recommended untuk Next.js)
      interpreter: "none",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // NOTE: Next.js sudah optimized untuk production
      // Kalau perlu scale, lebih baik pakai multiple instances di level nginx/reverse proxy
      // atau deploy ke platform yang handle scaling otomatis (Vercel, etc)
    },
  ],
};

