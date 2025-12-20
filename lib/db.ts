import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Configure connection pool for cluster mode
// Note: PrismaPg uses pg pool internally, connection limits are handled by pg
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

// In cluster mode, each instance creates its own connection pool
// Make sure PostgreSQL max_connections is high enough for all instances
// Example: 4 instances × 10 connections each = 40 connections minimum

export default db;
