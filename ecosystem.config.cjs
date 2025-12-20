module.exports = {
  apps: [
    {
      name: "jblog-frontend",
      script: "npm",
      args: "run start",
      cwd: "./frontend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};

