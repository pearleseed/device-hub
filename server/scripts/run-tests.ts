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

async function startServer(): Promise<void> {
  console.log(c("cyan", "🚀 Starting server..."));

  serverProcess = spawn({
    cmd: ["bun", "run", "server/index.ts"],
    stdout: "pipe",
    stderr: "pipe",
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
    } catch {
      // Server not ready yet
    }
    await Bun.sleep(500);
    attempts++;
  }

  throw new Error("Server failed to start within 15 seconds");
}

async function stopServer(): Promise<void> {
  if (serverProcess) {
    console.log(c("yellow", "🛑 Stopping server..."));
    serverProcess.kill();
    serverProcess = null;
  }
}

async function runTests(): Promise<number> {
  console.log(c("cyan", "🧪 Running tests...\n"));

  const testProcess = spawn({
    cmd: ["npx", "vitest", "--run", "--passWithNoTests"],
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env },
  });

  return await testProcess.exited;
}

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
