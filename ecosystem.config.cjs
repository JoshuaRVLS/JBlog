const path = require("path");

module.exports = {
  apps: [
    {
      name: "jblog-frontend",
      script: path.join(__dirname, "start.cjs"),
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true,
      kill_timeout: 5000,
      min_uptime: "10s",
      max_restarts: 10,
    },
  ],
};

