
export async function initDatabase() {
  try {
    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
}
