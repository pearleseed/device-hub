/**
 * Database Reset Script
 * WARNING: This script drops all tables and recreates them, deleting all data.
 * It then seeds the database with initial data.
 * Use with caution!
 */
import { initializeDatabase, seedDatabase } from "../db/connection";
import * as log from "./lib/logger";

async function main() {
  const startTime = Date.now();

  log.header("DATABASE RESET", "Drop and recreate all tables");
  log.warn("This will delete all existing data!");
  console.log();

  try {
    // Step 1: Initialize schema
    log.step("Initializing database schema", "start", undefined, {
      current: 1,
      total: 2,
    });
    await initializeDatabase();
    log.step("Schema initialized", "done", "tables created", {
      current: 1,
      total: 2,
    });

    // Step 2: Seed data from SQL
    log.step("Seeding data from seed.sql", "start", undefined, {
      current: 2,
      total: 2,
    });
    await seedDatabase();
    log.step("Data seeded", "done", "departments, users, devices, requests", {
      current: 2,
      total: 2,
    });

    const duration = Date.now() - startTime;

    log.success("Database Reset Complete", duration, {
      Source: "seed.sql",
    });

    log.infoBox("Login Credentials", [
      { label: "Password (all users)", value: "password123", color: "green" },
      { label: "Superuser", value: "superuser@company.com", color: "magenta" },
      { label: "Admin", value: "alex.johnson@company.com", color: "cyan" },
      { label: "User", value: "sarah.chen@company.com", color: "dim" },
    ]);

    process.exit(0);
  } catch (err) {
    log.error("Failed to reset database", err);
    process.exit(1);
  }
}

main();
