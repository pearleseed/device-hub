import { db, seedDatabase } from "../db/connection";
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

// Define seed users with plain text passwords
const SEED_PASSWORD = "password123";

const SEED_USERS = [
  // IT Department (Admins)
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
  // Engineering
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
  // Design
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
  // Marketing
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
  // HR
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
  step: string,
  status: "start" | "done" | "error",
  detail?: string,
): void {
  const timestamp = new Date().toLocaleTimeString();
  const detailStr = detail ? ` ${colors.dim}(${detail})${colors.reset}` : "";

  if (status === "start") {
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ${colors.yellow}>${colors.reset} ${step}...${detailStr}`,
    );
  } else if (status === "done") {
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ${colors.green}+${colors.reset} ${step}${detailStr}`,
    );
  } else {
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ${colors.red}x${colors.reset} ${step} ${colors.red}failed${colors.reset}`,
    );
  }
}

function printProgress(current: number, total: number, label: string): void {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  process.stdout.write(
    `\r${colors.dim}   ${bar} ${percentage}% - ${label}${colors.reset}`.padEnd(
      70,
    ),
  );

  if (current === total) {
    console.log(); // New line when complete
  }
}

function printSummaryTable(data: { label: string; count: number }[]): void {
  console.log();
  console.log(`${colors.cyan}┌${"─".repeat(40)}┐${colors.reset}`);
  console.log(
    `${colors.cyan}│${colors.reset}${colors.bright}  Seed Data Summary${" ".repeat(20)}${colors.reset}${colors.cyan}│${colors.reset}`,
  );
  console.log(`${colors.cyan}├${"─".repeat(40)}┤${colors.reset}`);

  for (const item of data) {
    const line = `  ${item.label}`;
    const countStr = `${item.count}`;
    const padding = 40 - line.length - countStr.length - 2;
    console.log(
      `${colors.cyan}│${colors.reset}${line}${" ".repeat(padding)}${colors.green}${countStr}${colors.reset} ${colors.cyan}│${colors.reset}`,
    );
  }

  console.log(`${colors.cyan}└${"─".repeat(40)}┘${colors.reset}`);
}

function printSuccess(message: string, duration: number): void {
  console.log();
  console.log(`${colors.green}${"─".repeat(52)}${colors.reset}`);
  console.log(`${colors.green}+ ${colors.bright}${message}${colors.reset}`);
  console.log(`${colors.dim}  Completed in ${duration}ms${colors.reset}`);
  console.log(`${colors.green}${"─".repeat(52)}${colors.reset}`);
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

function printCredentials(): void {
  console.log();
  console.log(`${colors.yellow}┌${"─".repeat(50)}┐${colors.reset}`);
  console.log(
    `${colors.yellow}│${colors.reset}${colors.bright}  Login Credentials${" ".repeat(30)}${colors.reset}${colors.yellow}│${colors.reset}`,
  );
  console.log(`${colors.yellow}├${"─".repeat(50)}┤${colors.reset}`);
  console.log(
    `${colors.yellow}│${colors.reset}  Password for all users: ${colors.green}${SEED_PASSWORD}${colors.reset}${" ".repeat(12)}${colors.yellow}│${colors.reset}`,
  );
  console.log(`${colors.yellow}├${"─".repeat(50)}┤${colors.reset}`);
  console.log(
    `${colors.yellow}│${colors.reset}  ${colors.bright}Admin accounts:${colors.reset}${" ".repeat(33)}${colors.yellow}│${colors.reset}`,
  );
  console.log(
    `${colors.yellow}│${colors.reset}  ${colors.cyan}alex.johnson@company.com${colors.reset}${" ".repeat(24)}${colors.yellow}│${colors.reset}`,
  );
  console.log(
    `${colors.yellow}│${colors.reset}  ${colors.cyan}james.wilson@company.com${colors.reset}${" ".repeat(24)}${colors.yellow}│${colors.reset}`,
  );
  console.log(`${colors.yellow}├${"─".repeat(50)}┤${colors.reset}`);
  console.log(
    `${colors.yellow}│${colors.reset}  ${colors.bright}Sample user accounts:${colors.reset}${" ".repeat(27)}${colors.yellow}│${colors.reset}`,
  );
  console.log(
    `${colors.yellow}│${colors.reset}  ${colors.dim}sarah.chen@company.com${colors.reset}${" ".repeat(26)}${colors.yellow}│${colors.reset}`,
  );
  console.log(
    `${colors.yellow}│${colors.reset}  ${colors.dim}emily.davis@company.com${colors.reset}${" ".repeat(25)}${colors.yellow}│${colors.reset}`,
  );
  console.log(`${colors.yellow}└${"─".repeat(50)}┘${colors.reset}`);
  console.log();
}

/**
 * Insert users with properly hashed passwords
 */
async function seedUsers(): Promise<void> {
  printStep("Generating password hashes", "start");

  // Generate password hash (all users use the same password for seed data)
  const passwordHash = await hashPassword(SEED_PASSWORD);

  printStep("Password hash generated", "done");
  printStep("Inserting seed users", "start", `${SEED_USERS.length} users`);

  let insertedCount = 0;
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
    insertedCount++;
    printProgress(insertedCount, SEED_USERS.length, `${user.name}`);
  }

  printStep(
    "Users seeded",
    "done",
    `${SEED_USERS.length} users with hashed passwords`,
  );
}

async function main() {
  const startTime = Date.now();

  printHeader("DATABASE SEEDING");

  console.log(
    `${colors.dim}  This script will populate the database with sample data${colors.reset}`,
  );
  console.log(
    `${colors.dim}  including departments, devices, users, and borrowing records.${colors.reset}`,
  );
  console.log();

  try {
    // First, run the main seed SQL (departments, equipment, borrowing requests, etc.)
    printStep("Running seed SQL script", "start");
    await seedDatabase();
    printStep(
      "Base seed data inserted",
      "done",
      "departments, devices, requests",
    );

    // Then seed users with properly hashed passwords
    await seedUsers();

    const duration = Date.now() - startTime;

    // Count statistics for summary
    const adminCount = SEED_USERS.filter((u) => u.role === "admin").length;
    const userCount = SEED_USERS.filter((u) => u.role === "user").length;
    const departmentCount = new Set(SEED_USERS.map((u) => u.department_id))
      .size;

    printSummaryTable([
      { label: "Departments", count: departmentCount },
      { label: "Admin users", count: adminCount },
      { label: "Regular users", count: userCount },
      { label: "Total users", count: SEED_USERS.length },
    ]);

    printSuccess("Database seeded successfully!", duration);
    printCredentials();

    process.exit(0);
  } catch (error) {
    printError("Failed to seed database", error);
    process.exit(1);
  }
}

main();
