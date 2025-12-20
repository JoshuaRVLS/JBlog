const path = require("path");

module.exports = {
  apps: [
    {
      name: "jblog-frontend",
      script: "next",
      args: "start",
      cwd: path.join(__dirname),
      instances: 1,
      exec_mode: "fork",
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

