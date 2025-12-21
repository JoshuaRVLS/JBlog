import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Setup connection pool untuk database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // maksimal koneksi di pool
  min: 2, // minimal koneksi yang tetap aktif
  connectionTimeoutMillis: 10000, // timeout saat connect
  idleTimeoutMillis: 30000, // disconnect koneksi yang idle
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Handle error dari pool, jangan exit aplikasi
pool.on("error", (err) => {
  console.error("Database pool error:", err);
});

const db = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: process.env.NODE_ENV === "development" ? ["error", "warn", "query"] : ["error"],
});

// Tutup koneksi saat aplikasi shutdown
process.on("beforeExit", async () => {
  await pool.end();
  await db.$disconnect();
});

export default db;
