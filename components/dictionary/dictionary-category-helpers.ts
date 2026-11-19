import type { WordCategory } from "./dictionary-types";

export function importCategoryName(
  item: WordCategory,
  language: string,
): string {
  const translated =
    language === "sv"
      ? item.name_sv
      : language === "en"
        ? item.name_en
        : item.name_es;

  return (
    translated?.trim() ||
    item.name_en?.trim() ||
    item.name_sv?.trim() ||
    item.name
  );
}
