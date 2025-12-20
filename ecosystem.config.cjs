const path = require("path");

module.exports = {
  apps: [
    {
      name: "jblog-frontend",
      script: "npm",
      args: "run start",
      cwd: path.join(__dirname),
      instances: 1,
      exec_mode: "fork",
      interpreter: "none",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};

