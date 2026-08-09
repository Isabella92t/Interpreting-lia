import { createTables } from "./database";

export async function initDatabase() {
  try {
    await createTables();
    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
}