import { initializeDatabase } from "../db/connection";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

function printHeader(title: string): void {
  const line = "═".repeat(50);
  console.log();
  console.log(`${colors.cyan}╔${line}╗${colors.reset}`);
  console.log(
    `${colors.cyan}║${colors.reset}${colors.bright}  ${title.padEnd(48)}${colors.reset}${colors.cyan}║${colors.reset}`,
  );
  console.log(`${colors.cyan}╚${line}╝${colors.reset}`);
  console.log();
}

function printStep(step: string, status: "start" | "done" | "error"): void {
  const timestamp = new Date().toLocaleTimeString();
  if (status === "start") {
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ${colors.yellow}>${colors.reset} ${step}...`,
    );
  } else if (status === "done") {
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ${colors.green}+${colors.reset} ${step} ${colors.green}completed${colors.reset}`,
    );
  } else {
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ${colors.red}x${colors.reset} ${step} ${colors.red}failed${colors.reset}`,
    );
  }
}

function printSuccess(message: string, duration: number): void {
  console.log();
  console.log(`${colors.green}${"─".repeat(52)}${colors.reset}`);
  console.log(`${colors.green}+ ${colors.bright}${message}${colors.reset}`);
  console.log(`${colors.dim}  Completed in ${duration}ms${colors.reset}`);
  console.log(`${colors.green}${"─".repeat(52)}${colors.reset}`);
  console.log();
}

function printError(message: string, error: unknown): void {
  console.log();
  console.log(`${colors.red}${"─".repeat(52)}${colors.reset}`);
  console.log(`${colors.red}x ${colors.bright}${message}${colors.reset}`);
  console.log();
  console.log(`${colors.dim}Error details:${colors.reset}`);
  console.error(error);
  console.log(`${colors.red}${"─".repeat(52)}${colors.reset}`);
  console.log();
}

async function main() {
  const startTime = Date.now();

  printHeader("DATABASE INITIALIZATION");

  console.log(
    `${colors.dim}  This script will create all database tables${colors.reset}`,
  );
  console.log(`${colors.dim}  and set up the schema structure.${colors.reset}`);
  console.log();

  try {
    printStep("Connecting to database", "start");
    printStep("Creating tables and indexes", "start");

    await initializeDatabase();

    printStep("Database schema initialized", "done");

    const duration = Date.now() - startTime;
    printSuccess("Database schema initialized successfully!", duration);

    console.log(`${colors.cyan}  Next steps:${colors.reset}`);
    console.log(
      `${colors.dim}   - Run ${colors.cyan}bun run db:seed${colors.reset}${colors.dim} to populate with sample data${colors.reset}`,
    );
    console.log(
      `${colors.dim}   - Or run ${colors.cyan}bun run db:reset${colors.reset}${colors.dim} to initialize and seed in one step${colors.reset}`,
    );
    console.log();

    process.exit(0);
  } catch (error) {
    printError("Failed to initialize database", error);
    process.exit(1);
  }
}

main();
