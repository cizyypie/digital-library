import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}
const sql = postgres(connectionString, {
  ssl: true, 
  max: 10, 
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql);
