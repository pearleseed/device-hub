import { seedDatabase } from "../db/connection";
import * as log from "./lib/logger";

async function main() {
  const startTime = Date.now();

  log.header("DATABASE SEEDING", "Populating with sample data");
  log.info("This will insert departments, devices, users, and borrow records.");
  console.log();

  try {
    log.step("Running seed SQL script", "start");
    await seedDatabase();
    log.step(
      "Seed data inserted",
      "done",
      "departments, users, devices, requests",
    );

    const duration = Date.now() - startTime;

    log.success("Database Seeded", duration, {
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
    log.error("Failed to seed database", err);
    process.exit(1);
  }
}

main();
