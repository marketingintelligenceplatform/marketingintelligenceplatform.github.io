import { promises as fs } from "node:fs";
import path from "node:path";
import type { PoolClient } from "pg";
import { pool } from "../server/config/database";

const migrationDirectory = path.join(process.cwd(), "db", "migrations");
const baselineVersion = "000_schema_baseline.sql";
const baselineTables = [
  "organizations",
  "users",
  "roles",
  "organization_users",
  "pipeline_stages",
  "campaigns",
  "leads",
  "activities",
  "followups",
  "lead_stage_history",
];

async function ensureMigrationTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function listMigrationFiles(): Promise<string[]> {
  return (await fs.readdir(migrationDirectory))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();
}

async function isApplied(client: PoolClient, version: string): Promise<boolean> {
  const result = await client.query(
    "SELECT 1 FROM schema_migrations WHERE version = $1",
    [version],
  );
  return result.rowCount === 1;
}

async function existingBaselineTableCount(client: PoolClient): Promise<number> {
  const result = await client.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [baselineTables],
  );
  return result.rowCount ?? 0;
}

export async function registerExistingBaseline(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await ensureMigrationTable(client);

    if (await isApplied(client, baselineVersion)) {
      await client.query("COMMIT");
      console.log(`[PostgreSQL] Baseline ${baselineVersion} is already registered.`);
      return;
    }

    const existingTableCount = await existingBaselineTableCount(client);
    if (existingTableCount !== baselineTables.length) {
      throw new Error(
        `Cannot register the baseline: expected ${baselineTables.length} existing MIP tables, found ${existingTableCount}.`,
      );
    }

    await client.query(
      "INSERT INTO schema_migrations (version) VALUES ($1)",
      [baselineVersion],
    );
    await client.query("COMMIT");
    console.log(`[PostgreSQL] Registered existing schema as ${baselineVersion} without altering application tables.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await ensureMigrationTable(client);
    const migrationFiles = await listMigrationFiles();

    for (const version of migrationFiles) {
      if (await isApplied(client, version)) continue;

      const existingTableCount = await existingBaselineTableCount(client);
      if (version === baselineVersion && existingTableCount > 0) {
        throw new Error(
          `Existing MIP tables were found. Run "npm run db:baseline" to register ${baselineVersion} before applying later migrations.`,
        );
      }
      if (version !== baselineVersion && existingTableCount !== baselineTables.length) {
        throw new Error(
          "The database does not contain the complete MIP baseline. Resolve the baseline before applying later migrations.",
        );
      }

      const sql = await fs.readFile(path.join(migrationDirectory, version), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ($1)",
          [version],
        );
        await client.query("COMMIT");
        console.log(`[PostgreSQL] Applied migration ${version}.`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
  }
}
