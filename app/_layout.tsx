import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { AuthProvider } from "@/context/auth-context";

import { createTables } from "../database/database";
import { seedDatabase } from "../database/seedDatabase";

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="words-v3.db"
      onInit={async (db) => {
        await createTables(db);
        await seedDatabase(db);
      }}
    >
      <AuthProvider>
        <Stack />
      </AuthProvider>
    </SQLiteProvider>
  );
}
