export const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

// Felmeddelanden för sparade ordlistor.
const deckErrorTexts = {
  sv: {
    title: "Fel",
    save: "Kunde inte spara ordlistan. Försök igen.",
    delete: "Kunde inte radera ordlistan. Försök igen.",
  },
  en: {
    title: "Error",
    save: "Could not save the word list. Please try again.",
    delete: "Could not delete the word list. Please try again.",
  },
  es: {
    title: "Error",
    save: "No se pudo guardar la lista de palabras. Inténtalo de nuevo.",
    delete: "No se pudo eliminar la lista de palabras. Inténtalo de nuevo.",
  },
};

export function getDeckErrorTexts(language: string) {
  const code = language.toLowerCase();

  if (code === "sv") return deckErrorTexts.sv;
  if (code === "es") return deckErrorTexts.es;

  return deckErrorTexts.en;
}

// Texter för hur användaren vill öva.
const practiceLabels = {
  sv: {
    all: "Öva på alla ord",
    allHelp: "Öva på alla ord i det här urvalet.",
    random: "Öva på slumpmässiga ord",
    randomHelp: "Appen väljer ord slumpmässigt.",
    pick: "Välj ord att öva på",
    pickHelp: "Välj ord bara för den här övningen.",
    edit: "Redigera min lista",
    editHelp: "Lägg till eller ta bort ord i din sparade lista.",
  },
  en: {
    all: "Practise all words",
    allHelp: "Practise every word in this selection.",
    random: "Practise random words",
    randomHelp: "The app chooses words at random.",
    pick: "Choose words to practise",
    pickHelp: "Choose words for this session only.",
    edit: "Edit my list",
    editHelp: "Add or remove words from your saved list.",
  },
  es: {
    all: "Practicar todas las palabras",
    allHelp: "Practica todas las palabras de esta selección.",
    random: "Practicar palabras aleatorias",
    randomHelp: "La app elige palabras al azar.",
    pick: "Seleccionar palabras para practicar",
    pickHelp: "Elige palabras solo para esta sesión.",
    edit: "Editar mi lista",
    editHelp: "Añade o elimina palabras de tu lista guardada.",
  },
};

export function getPracticeLabels(language: string) {
  const code = language.toLowerCase();

  if (code === "es") return practiceLabels.es;
  if (code === "en") return practiceLabels.en;

  return practiceLabels.sv;
}
