import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Konfigurasi untuk Neon
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}
const sql = postgres(connectionString, {
  ssl: true, // Wajib untuk Neon DB
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql);
