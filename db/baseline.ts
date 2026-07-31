import "dotenv/config";
import { pool } from "../server/config/database";
import { registerExistingBaseline } from "./migration-runner";

registerExistingBaseline()
  .catch((error) => {
    console.error("[PostgreSQL] Baseline registration failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
