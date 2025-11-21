import { db } from "./db";
import { subjects, users, chatSettings } from "@shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Check if subjects already exist
    const existingSubjects = await db.select().from(subjects).limit(1);
    if (existingSubjects.length > 0) {
      console.log("✓ Database already seeded");
      return;
    }

    // Default subjects for different streams
    const defaultSubjects = [
      // School subjects (applicable to classes 5-12)
      { name: "Hindi", stream: "School", class: "5-12", icon: "book" },
      { name: "English", stream: "School", class: "5-12", icon: "book" },
      { name: "Mathematics", stream: "School", class: "5-12", icon: "calculator" },
      { name: "Science", stream: "School", class: "5-12", icon: "flask" },
      { name: "Social Studies", stream: "School", class: "5-12", icon: "globe" },
      
      // NEET subjects (classes 11-12)
      { name: "Physics", stream: "NEET", class: "11-12", icon: "atom" },
      { name: "Chemistry", stream: "NEET", class: "11-12", icon: "flask" },
      { name: "Botany", stream: "NEET", class: "11-12", icon: "leaf" },
      { name: "Zoology", stream: "NEET", class: "11-12", icon: "bug" },
      
      // JEE subjects (classes 11-12)
      { name: "Physics", stream: "JEE", class: "11-12", icon: "atom" },
      { name: "Chemistry", stream: "JEE", class: "11-12", icon: "flask" },
      { name: "Mathematics", stream: "JEE", class: "11-12", icon: "calculator" },
    ];

    // Insert subjects
    for (const subject of defaultSubjects) {
      await db.insert(subjects).values(subject);
    }
    console.log(`✓ Created ${defaultSubjects.length} default subjects`);

    // Create initial admin user with hashed password
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      name: "Admin",
      username: "admin",
      password: hashedPassword,
      gender: "Male",
      stream: "School",
      class: "12",
      language: "english",
      isAdmin: true,
      adminClass: "all",
    });
    console.log("✓ Created admin user (username: admin, password: admin123)");

    // Initialize chat settings for all streams
    const streams = ["School", "NEET", "JEE"];
    for (const stream of streams) {
      await db.insert(chatSettings).values({
        stream,
        isEnabled: true,
      });
    }
    console.log("✓ Initialized chat settings for all streams");

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seed };
