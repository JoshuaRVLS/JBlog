#!/usr/bin/env node
// Wrapper to start Next.js (CommonJS for PM2 compatibility)
const { spawn } = require("child_process");
const path = require("path");

const nextPath = path.join(__dirname, "node_modules", ".bin", "next");
const args = ["start"];

const child = spawn(nextPath, args, {
  stdio: "inherit",
  cwd: __dirname,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});

process.on("SIGTERM", () => {
  child.kill("SIGTERM");
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
});

