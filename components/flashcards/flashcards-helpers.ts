import type { Card, Category } from "@/components/flashcards/flashcards-types";

// Blandar korten så att ordningen blir slumpmässig.
export function shuffle(items: Card[]): Card[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

// Visar kategorinamnet på appens valda språk.
export function getCategoryName(category: Category, language: string): string {
  const currentLanguage = String(language).toLowerCase();

  const svenska = category.name_sv?.trim() || "";
  const engelska = category.name_en?.trim() || "";
  const spanska = category.name_es?.trim() || "";

  if (currentLanguage === "en") {
    return engelska || svenska || spanska || category.name;
  }

  if (currentLanguage === "es") {
    return spanska || svenska || engelska || category.name;
  }

  return svenska || engelska || spanska || category.name;
}
