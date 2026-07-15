import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Connection Pool Configuration
  max: 10, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Wait up to 5 seconds for a connection
});

export async function connectDatabase(): Promise<void> {
  let client;

  try {
    client = await pool.connect();

    console.log("========================================");
    console.log("✅ PostgreSQL Connected Successfully");
    console.log("========================================");

    const result = await client.query("SELECT NOW();");

    console.log("🕒 Database Time:", result.rows[0].now);

    const version = await client.query("SELECT version();");

    console.log("🐘 PostgreSQL Version:");
    console.log(version.rows[0].version);

    console.log("========================================");
  } catch (error) {
    console.error("========================================");
    console.error("❌ Database Connection Failed");
    console.error("========================================");
    console.error(error);

    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
  }
}