import { Redirect } from "expo-router";

// Appen startar direkt på första sidan, där man väljer språk.
export default function Index() {
  return <Redirect href="/firstPage" />;
}
