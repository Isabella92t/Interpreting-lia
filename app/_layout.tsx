import { useEffect } from "react";
import { createTables } from "../database/database";

import { Stack } from "expo-router";

import { AuthProvider } from "@/context/auth-context";

export default function RootLayout() {

  // useEffect(() => {
  //   createTables();
  // }, []);

  return (
    <AuthProvider>
      <Stack />
    </AuthProvider>
  );
}