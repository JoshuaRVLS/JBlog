#!/usr/bin/env node
// Wrapper to start with tsx
const { spawn } = require("child_process");
const path = require("path");

const tsxPath = path.join(__dirname, "node_modules", ".bin", "tsx");
const scriptPath = path.join(__dirname, "index.ts");

const child = spawn(tsxPath, [scriptPath], {
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

