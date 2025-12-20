module.exports = {
  apps: [
    {
      name: "jblog-backend",
      script: "npx",
      args: "tsx index.ts",
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};

