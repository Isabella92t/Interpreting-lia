import type { Translation } from "./dictionary-types";

export const MIN_SEARCH_LENGTH = 3;
export const MAX_RESULTS = 3;

function normalizeSearchText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

export function startsWithSearch(text: string, query: string) {
  const normalizedText = normalizeSearchText(text);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return false;

  if (normalizedQuery.includes(" ")) {
    return normalizedText.includes(normalizedQuery);
  }

  return normalizedText
    .split(/[\s/,()!?;:]+/)
    .some((word) => word.startsWith(normalizedQuery));
}

export function getDictionarySearchResults(
  translations: Translation[],
  searchText: string,
) {
  const normalizedSearch = searchText.trim().toLowerCase();

  const hasEnoughLetters = normalizedSearch.length >= MIN_SEARCH_LENGTH;

  const searchResults = hasEnoughLetters
    ? translations
        .filter(
          (item) =>
            startsWithSearch(item.text_from, normalizedSearch) ||
            startsWithSearch(item.text_to, normalizedSearch),
        )
        .map((item) => {
          const fromMatches = startsWithSearch(
            item.text_from,
            normalizedSearch,
          );

          const toMatches = startsWithSearch(item.text_to, normalizedSearch);

          return toMatches && !fromMatches
            ? {
                ...item,
                text_from: item.text_to,
                text_to: item.text_from,
              }
            : item;
        })
    : [];

  const filteredTranslations = hasEnoughLetters
    ? searchResults
    : translations
        .filter(() => normalizedSearch.length === 0)
        .sort((a, b) =>
          a.text_from.localeCompare(b.text_from, "sv", {
            sensitivity: "base",
          }),
        );

  return {
    normalizedSearch,
    hasEnoughLetters,
    searchResults,
    filteredTranslations,
  };
}
