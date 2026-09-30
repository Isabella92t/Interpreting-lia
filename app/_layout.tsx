import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { colors } from "@/constants/colors";
import { AuthProvider } from "@/context/auth-context";
import { UiLanguageProvider } from "@/context/ui-language-context";

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
      <UiLanguageProvider>
        <AuthProvider>
          <Stack
            screenOptions={{
              // Varje sida ritar sin egen rubrik och sin egen
              // tillbaka-pil, sa vi doljer den inbyggda listen.
              headerShown: false,
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          />
        </AuthProvider>
      </UiLanguageProvider>
    </SQLiteProvider>
  );
}
