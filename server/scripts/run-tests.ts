/**
 * Test runner script
 * 1. Starts the server
 * 2. Runs tests
 * 3. Stops the server
 * 4. Resets the database
 */

import { spawn, type Subprocess } from "bun";
import { colors } from "./lib/logger";

const c = (color: keyof typeof colors, text: string) =>
  `${colors[color]}${text}${colors.reset}`;

let serverProcess: Subprocess | null = null;

/**
 * Starts the application server in a child process
 * Waits for the health check endpoint to respond before proceeding
 */
async function startServer(): Promise<void> {
  console.log(c("cyan", "🚀 Starting server..."));

  serverProcess = spawn({
    cmd: ["bun", "run", "server/index.ts"],
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env },
  });

  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch("http://localhost:3001/api/health");
      if (response.ok) {
        console.log(c("green", "✅ Server is ready"));
        return;
      }
      console.log(c("yellow", `⏳ Server returned status ${response.status}, retrying...`));
    } catch (error) {
      // Server not ready yet
      console.log(c("dim", `⌛ waiting for server... (${attempts + 1}/${maxAttempts}) - ${error instanceof Error ? error.message : String(error)}`));
    }
    await Bun.sleep(500);
    attempts++;
  }

  throw new Error("Server failed to start within 15 seconds");
}

/**
 * Stops the running server process if it exists
 */
async function stopServer(): Promise<void> {
  if (serverProcess) {
    console.log(c("yellow", "🛑 Stopping server..."));
    serverProcess.kill();
    serverProcess = null;
  }
}

/**
 * Runs the test suite using Vitest
 * Passes any command line arguments to Vitest
 * @returns Exit code from the test runner
 */
async function runTests(): Promise<number> {
  console.log(c("cyan", "🧪 Running tests...\n"));

  const args = process.argv.slice(2);
  const testProcess = spawn({
    cmd: ["npx", "vitest", "--run", "--passWithNoTests", ...args],
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env },
  });

  return await testProcess.exited;
}

/**
 * Resets the database to a clean state
 * Runs the silent reset script to avoid log noise
 */
async function resetDatabase(): Promise<void> {
  console.log(c("cyan", "\n🔄 Resetting database..."));

  const resetProcess = spawn({
    cmd: ["bun", "run", "server/scripts/reset-db-silent.ts"],
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env },
  });

  await resetProcess.exited;
}

/**
 * Main entry point
 * Orchestrates the full test run lifecycle.
 */
async function main(): Promise<void> {
  let testExitCode = 1;

  try {
    await startServer();
    testExitCode = await runTests();
  } catch (error) {
    console.error(c("red", "❌ Error:"), error);
  } finally {
    await stopServer();
    await resetDatabase();
  }

  process.exit(testExitCode);
}

process.on("SIGINT", async () => {
  await stopServer();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  await stopServer();
  process.exit(1);
});

main();
