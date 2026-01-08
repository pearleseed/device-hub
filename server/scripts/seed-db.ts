import { db, seedDatabase } from "../db/connection";
import { hashPassword } from "../middleware/auth";

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

/**
 * Insert users with properly hashed passwords
 */
async function seedUsers(): Promise<void> {
  console.log("Generating password hashes for seed users...");

  // Generate password hash (all users use the same password for seed data)
  const passwordHash = await hashPassword(SEED_PASSWORD);

  console.log("Inserting seed users...");

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
  }

  console.log(`✅ Inserted ${SEED_USERS.length} users with hashed passwords`);
}

async function main() {
  console.log("Seeding database...");
  try {
    // First, run the main seed SQL (departments, equipment, borrowing requests, etc.)
    await seedDatabase();

    // Then seed users with properly hashed passwords
    // This will update the users that were inserted with placeholder hashes
    await seedUsers();

    console.log("✅ Database seeded successfully!");
    console.log(`   Password for all seed users: ${SEED_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    process.exit(1);
  }
}

main();
