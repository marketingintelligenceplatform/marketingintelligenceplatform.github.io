import "dotenv/config";
import { pool } from "../server/config/database";
import { runMigrations } from "./migration-runner";

runMigrations()
  .catch((error) => {
    console.error("[PostgreSQL] Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
