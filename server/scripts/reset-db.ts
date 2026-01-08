import { initializeDatabase, seedDatabase } from "../db/connection";

async function main() {
  console.log("Resetting database...");
  try {
    console.log("Step 1: Initializing schema...");
    await initializeDatabase();
    console.log("Step 2: Seeding data...");
    await seedDatabase();
    console.log("✅ Database reset successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to reset database:", error);
    process.exit(1);
  }
}

main();
