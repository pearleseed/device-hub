import { initializeDatabase } from "../db/connection";
import { spawn } from "bun";

async function seedWithMysql(): Promise<void> {
  const seedFile = import.meta.dir + "/../db/seed.sql";
  
  const proc = spawn({
    cmd: ["mysql", "-u", process.env.DB_USER || "root", 
          `-p${process.env.DB_PASSWORD || ""}`,
          process.env.DB_NAME || "device_hub"],
    stdin: Bun.file(seedFile),
    stdout: "pipe",
    stderr: "pipe",
  });
  
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Seed failed: ${stderr}`);
  }
}

async function main() {
  try {
    await initializeDatabase();
    await seedWithMysql();
    process.exit(0);
  } catch (err) {
    console.error("Failed to reset database:", err);
    process.exit(1);
  }
}

main();
