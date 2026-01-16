/**
 * Database Initialization Script
 * Creates the database schema (tables, indexes) if they don't exist.
 * Safe to run multiple times (idempotent).
 */
import { initializeDatabase } from "../db/connection";
import * as log from "./lib/logger";

async function main() {
  const startTime = Date.now();

  log.header("DATABASE INITIALIZATION", "Creating tables and schema structure");

  try {
    log.step("Connecting to database", "start");
    log.step("Creating tables and indexes", "start");

    await initializeDatabase();

    log.step("Database schema initialized", "done");

    const duration = Date.now() - startTime;
    log.success("Database Initialized", duration);

    log.nextSteps([
      "Run `bun run db:seed` to populate with sample data",
      "Or run `bun run db:reset` to initialize and seed in one step",
    ]);

    process.exit(0);
  } catch (err) {
    log.error("Failed to initialize database", err);
    process.exit(1);
  }
}

main();
