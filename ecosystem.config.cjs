module.exports = {
  apps: [
    {
      name: "jblog-backend",
      script: "npx",
      args: "tsx index.ts",
      cwd: "./backend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};

