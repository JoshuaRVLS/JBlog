import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Configure connection pool for better performance
// Connection pool settings optimized for VPS
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Maximum number of clients in the pool
  max: 20,
  // Minimum number of clients in the pool (keep connections warm for faster queries)
  min: 5,
  // Number of milliseconds to wait before timing out when connecting a new client
  connectionTimeoutMillis: 2000,
  // Number of milliseconds a client must sit idle in the pool before it is disconnected
  idleTimeoutMillis: 30000,
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle database client", err);
  process.exit(-1);
});

const db = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: process.env.NODE_ENV === "development" ? ["error", "warn", "query"] : ["error"],
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await pool.end();
  await db.$disconnect();
});

// In cluster mode, each instance creates its own connection pool
// Make sure PostgreSQL max_connections is high enough for all instances
// Example: 1 instance × 20 connections = 20 connections minimum

export default db;
