export type Category = {
  id: number;
  name: string;
  name_sv: string | null;
  name_en: string | null;
  name_es: string | null;
};

export type Translation = {
  word_id: number;
  text_from: string;
  text_to: string;
  information: string | null;
};

export const CATEGORIES_PER_PAGE = 3;
export const CATEGORY_GAP = 10;
export const RECENT_CATEGORIES_KEY = "recentCategories";
export const CATEGORY_EXPANDED_KEY = "categoriesExpanded";
export const MIN_SEARCH_LENGTH = 3;
export const MAX_RESULTS = 3;

// Texter som används på den här sidan och ännu inte finns i t().
export const pageTexts = {
  sv: {
    saving: "Sparar...",
    optionalInformation: "Information (frivilligt)",
    moreResults: "fler träffar",
    saveWordFailed: "Kunde inte spara ordet. Försök igen.",
    chooseCategory: "Välj kategori",
    done: "Klar",
    showInformationAbout: "Visa information om",
  },
  en: {
    saving: "Saving...",
    optionalInformation: "Information (optional)",
    moreResults: "more results",
    saveWordFailed: "Could not save the word. Please try again.",
    chooseCategory: "Choose category",
    done: "Done",
    showInformationAbout: "Show information about",
  },
  es: {
    saving: "Guardando...",
    optionalInformation: "Información (opcional)",
    moreResults: "resultados más",
    saveWordFailed: "No se pudo guardar la palabra. Inténtalo de nuevo.",
    chooseCategory: "Elegir categoría",
    done: "Listo",
    showInformationAbout: "Mostrar información sobre",
  },
};

export const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

export function sortByRecentlyUsed(
  categories: Category[],
  recentNames: string[],
) {
  const recent: Category[] = [];

  for (const name of recentNames) {
    const category = categories.find((item) => item.name === name);
    if (category) recent.push(category);
  }

  const rest = categories.filter((item) => !recentNames.includes(item.name));

  return [...recent, ...rest];
}

export function splitIntoPages(categories: Category[]) {
  const pages: Category[][] = [];

  for (let i = 0; i < categories.length; i += CATEGORIES_PER_PAGE) {
    pages.push(categories.slice(i, i + CATEGORIES_PER_PAGE));
  }

  return pages;
}

// Söker bland alla ord och fraser, även utan accenter.
export function startsWithSearch(text: string, searchText: string) {
  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ");

  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(searchText);

  if (!normalizedSearch) return false;

  if (normalizedSearch.includes(" ")) {
    return normalizedText.includes(normalizedSearch);
  }

  const words = normalizedText.split(/[\s/,()!?;:]+/);

  return words.some((word) => word.startsWith(normalizedSearch));
}
