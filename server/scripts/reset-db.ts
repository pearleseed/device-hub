import { initializeDatabase, seedDatabase } from "../db/connection";
import { db } from "../db/connection";
import { hashPassword } from "../middleware/auth";

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

const SEED_PASSWORD = "password123";

const SEED_USERS = [
  {
    name: "Alex Johnson",
    email: "alex.johnson@company.com",
    department_id: 1,
    role: "admin",
    avatar_url:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "James Wilson",
    email: "james.wilson@company.com",
    department_id: 1,
    role: "admin",
    avatar_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    department_id: 2,
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "David Kim",
    email: "david.kim@company.com",
    department_id: 2,
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Lisa Wang",
    email: "lisa.wang@company.com",
    department_id: 2,
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Michael Park",
    email: "michael.park@company.com",
    department_id: 3,
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Emma Rodriguez",
    email: "emma.rodriguez@company.com",
    department_id: 3,
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Emily Davis",
    email: "emily.davis@company.com",
    department_id: 4,
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Tom Anderson",
    email: "tom.anderson@company.com",
    department_id: 4,
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face",
  },
  {
    name: "Jennifer Lee",
    email: "jennifer.lee@company.com",
    department_id: 5,
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face",
  },
];

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

function printStep(
  stepNum: number,
  step: string,
  status: "start" | "done" | "error",
  detail?: string,
): void {
  const timestamp = new Date().toLocaleTimeString();
  const detailStr = detail ? ` ${colors.dim}(${detail})${colors.reset}` : "";

  if (status === "start") {
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ${colors.cyan}[${stepNum}/3]${colors.reset} ${colors.yellow}>${colors.reset} ${step}...`,
    );
  } else if (status === "done") {
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ${colors.cyan}[${stepNum}/3]${colors.reset} ${colors.green}+${colors.reset} ${step}${detailStr}`,
    );
  } else {
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ${colors.cyan}[${stepNum}/3]${colors.reset} ${colors.red}x${colors.reset} ${step} ${colors.red}failed${colors.reset}`,
    );
  }
}

function printSubStep(
  step: string,
  status: "start" | "done",
  detail?: string,
): void {
  const detailStr = detail ? ` ${colors.dim}(${detail})${colors.reset}` : "";
  if (status === "start") {
    console.log(
      `        ${colors.dim}├─${colors.reset} ${colors.yellow}>${colors.reset} ${step}...`,
    );
  } else {
    console.log(
      `        ${colors.dim}└─${colors.reset} ${colors.green}+${colors.reset} ${step}${detailStr}`,
    );
  }
}

function printProgress(current: number, total: number, label: string): void {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  process.stdout.write(
    `\r           ${colors.dim}${bar} ${percentage}% - ${label}${colors.reset}`.padEnd(
      70,
    ),
  );

  if (current === total) {
    console.log();
  }
}

function printSuccess(
  message: string,
  duration: number,
  stats: { tables: number; users: number },
): void {
  console.log();
  console.log(`${colors.green}╔${"═".repeat(50)}╗${colors.reset}`);
  console.log(
    `${colors.green}║${colors.reset}${colors.bright}  ${message.padEnd(48)}${colors.reset}${colors.green}║${colors.reset}`,
  );
  console.log(`${colors.green}╠${"═".repeat(50)}╣${colors.reset}`);
  console.log(
    `${colors.green}║${colors.reset}  Duration: ${colors.cyan}${duration}ms${colors.reset}${" ".repeat(35 - String(duration).length)}${colors.green}║${colors.reset}`,
  );
  console.log(
    `${colors.green}║${colors.reset}  Tables created: ${colors.cyan}${stats.tables}${colors.reset}${" ".repeat(30)}${colors.green}║${colors.reset}`,
  );
  console.log(
    `${colors.green}║${colors.reset}  Users seeded: ${colors.cyan}${stats.users}${colors.reset}${" ".repeat(31)}${colors.green}║${colors.reset}`,
  );
  console.log(`${colors.green}╚${"═".repeat(50)}╝${colors.reset}`);
}

function printCredentials(): void {
  console.log();
  console.log(`${colors.yellow}┌${"─".repeat(50)}┐${colors.reset}`);
  console.log(
    `${colors.yellow}│${colors.reset}${colors.bright}  Login Credentials${" ".repeat(30)}${colors.reset}${colors.yellow}│${colors.reset}`,
  );
  console.log(`${colors.yellow}├${"─".repeat(50)}┤${colors.reset}`);
  console.log(
    `${colors.yellow}│${colors.reset}  Password: ${colors.green}${SEED_PASSWORD}${colors.reset}${" ".repeat(26)}${colors.yellow}│${colors.reset}`,
  );
  console.log(
    `${colors.yellow}│${colors.reset}${" ".repeat(50)}${colors.yellow}│${colors.reset}`,
  );
  console.log(
    `${colors.yellow}│${colors.reset}  ${colors.bright}Admin:${colors.reset} ${colors.cyan}alex.johnson@company.com${colors.reset}${" ".repeat(14)}${colors.yellow}│${colors.reset}`,
  );
  console.log(
    `${colors.yellow}│${colors.reset}  ${colors.bright}User:${colors.reset}  ${colors.dim}sarah.chen@company.com${colors.reset}${" ".repeat(16)}${colors.yellow}│${colors.reset}`,
  );
  console.log(`${colors.yellow}└${"─".repeat(50)}┘${colors.reset}`);
  console.log();
}

function printError(message: string, error: unknown): void {
  console.log();
  console.log(`${colors.red}╔${"═".repeat(50)}╗${colors.reset}`);
  console.log(
    `${colors.red}║${colors.reset}${colors.bright}  ${message.padEnd(48)}${colors.reset}${colors.red}║${colors.reset}`,
  );
  console.log(`${colors.red}╚${"═".repeat(50)}╝${colors.reset}`);
  console.log();
  console.log(`${colors.dim}Error details:${colors.reset}`);
  console.error(error);
  console.log();
}

async function seedUsers(): Promise<void> {
  printSubStep("Generating password hashes", "start");
  const passwordHash = await hashPassword(SEED_PASSWORD);

  printSubStep("Inserting users", "start");
  let count = 0;
  for (const user of SEED_USERS) {
    await db`
      INSERT INTO users (name, email, password_hash, department_id, role, avatar_url)
      VALUES (${user.name}, ${user.email}, ${passwordHash}, ${user.department_id}, ${user.role}, ${user.avatar_url})
      ON DUPLICATE KEY UPDATE
        password_hash = VALUES(password_hash),
        name = VALUES(name),
        department_id = VALUES(department_id),
        role = VALUES(role),
        avatar_url = VALUES(avatar_url)
    `;
    count++;
    printProgress(count, SEED_USERS.length, user.name);
  }
  printSubStep(
    "Users created with hashed passwords",
    "done",
    `${SEED_USERS.length} users`,
  );
}

async function main() {
  const startTime = Date.now();

  printHeader("DATABASE RESET");

  console.log(
    `${colors.yellow}  Warning: ${colors.bright}This will drop and recreate all tables!${colors.reset}`,
  );
  console.log(
    `${colors.dim}  All existing data will be replaced with seed data.${colors.reset}`,
  );
  console.log();

  try {
    // Step 1: Initialize schema
    printStep(1, "Initializing database schema", "start");
    await initializeDatabase();
    printStep(1, "Schema initialized", "done", "tables created");

    // Step 2: Seed base data
    printStep(2, "Seeding base data", "start");
    await seedDatabase();
    printStep(2, "Base data seeded", "done", "departments, devices, requests");

    // Step 3: Seed users with hashed passwords
    printStep(3, "Seeding users", "start");
    await seedUsers();
    printStep(3, "Users seeded", "done", `${SEED_USERS.length} users`);

    const duration = Date.now() - startTime;

    printSuccess("Database Reset Complete!", duration, {
      tables: 5, // departments, users, devices, borrow_requests, device_history
      users: SEED_USERS.length,
    });

    printCredentials();

    process.exit(0);
  } catch (error) {
    printError("Failed to reset database", error);
    process.exit(1);
  }
}

main();
