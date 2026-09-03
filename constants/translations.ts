// All text som visas i appen samlas har, ett sprak i varje objekt.
// Vill man andra en text sa andrar man den bara pa ett stalle.
//
// Engelska ar standard. Om en text saknas i sv eller es
// visas den engelska texten istallet.

export const translations = {
  en: {
    // Sprakvaljaren
    appLanguage: "App language",

    // Forsta sidan
    chooseLanguages: "Choose languages",
    from: "FROM",
    to: "TO",
    continue: "Continue",

    // Andra sidan
    searchPlaceholder: "Search a word in any language",
    minThreeLetters: "Type at least three letters",
    noMatches: "No matches",
    categories: "Categories",
    dictionary: "Dictionary",
    idioms: "Idioms",
    notes: "Notes",
    addWord: "Add word",
    word: "Word",
    translation: "Translation",
    category: "Category",
    categoryOptional: "Optional – pick none to put the word in Övrigt.",
    add: "Add",
    cancel: "Cancel",
    fillAllFields: "Please fill in all fields",
    languagesNotFound: "Could not find the languages",
    wordAdded: "The word has been added!",

    // Ordboken
    words: "words",
    noWordsYet: "No words here yet",

    // Anteckningar
    myNotes: "My notes",
    noNotesYet: "You have no notes yet.\nPress + to write your first one.",
    noteTitle: "Title",
    noteText: "Write your note here...",
    save: "Save",
    delete: "Delete",
    untitled: "Untitled",
    writeSomethingFirst: "Write something first",
    deleteNoteTitle: "Delete this note?",
    deleteNoteMessage: "This cannot be undone.",

    // Inloggning
    appName: "Interpreter App",
    loginIntro: "Log in or create an account to continue.",
    loginButton: "Log in or create account",
    skip: "Skip",
  },

  sv: {
    appLanguage: "Appens språk",

    chooseLanguages: "Välj språk",
    from: "FRÅN",
    to: "TILL",
    continue: "Fortsätt",

    searchPlaceholder: "Sök ord på valfritt språk",
    minThreeLetters: "Skriv minst tre bokstäver",
    noMatches: "Inga träffar",
    categories: "Kategorier",
    dictionary: "Ordbok",
    idioms: "Idiom",
    notes: "Anteckningar",
    addWord: "Lägg till ord",
    word: "Ord",
    translation: "Översättning",
    category: "Kategori",
    categoryOptional: "Valfritt – välj ingen kategori för att lägga ordet i Övrigt.",
    add: "Lägg till",
    cancel: "Avbryt",
    fillAllFields: "Fyll i alla fält",
    languagesNotFound: "Språken kunde inte hittas",
    wordAdded: "Ordet har lagts till!",

    words: "ord",
    noWordsYet: "Inga ord här än",

    myNotes: "Mina anteckningar",
    noNotesYet: "Du har inga anteckningar än.\nTryck på + för att skriva din första.",
    noteTitle: "Rubrik",
    noteText: "Skriv din anteckning här...",
    save: "Spara",
    delete: "Ta bort",
    untitled: "Utan titel",
    writeSomethingFirst: "Skriv något först",
    deleteNoteTitle: "Ta bort anteckningen?",
    deleteNoteMessage: "Det går inte att ångra.",

    appName: "Tolkappen",
    loginIntro: "Logga in eller skapa ett konto för att fortsätta.",
    loginButton: "Logga in eller skapa konto",
    skip: "Hoppa över",
  },

  es: {
    appLanguage: "Idioma de la aplicación",

    chooseLanguages: "Elige idiomas",
    from: "DE",
    to: "A",
    continue: "Continuar",

    searchPlaceholder: "Busca una palabra en cualquier idioma",
    minThreeLetters: "Escribe al menos tres letras",
    noMatches: "Sin resultados",
    categories: "Categorías",
    dictionary: "Diccionario",
    idioms: "Modismos",
    notes: "Notas",
    addWord: "Añadir palabra",
    word: "Palabra",
    translation: "Traducción",
    category: "Categoría",
    categoryOptional:
      "Opcional: si no eliges ninguna, la palabra va a Övrigt.",
    add: "Añadir",
    cancel: "Cancelar",
    fillAllFields: "Rellena todos los campos",
    languagesNotFound: "No se encontraron los idiomas",
    wordAdded: "¡La palabra se ha añadido!",

    words: "palabras",
    noWordsYet: "Aún no hay palabras aquí",

    myNotes: "Mis notas",
    noNotesYet: "Aún no tienes notas.\nPulsa + para escribir la primera.",
    noteTitle: "Título",
    noteText: "Escribe tu nota aquí...",
    save: "Guardar",
    delete: "Eliminar",
    untitled: "Sin título",
    writeSomethingFirst: "Escribe algo primero",
    deleteNoteTitle: "¿Eliminar esta nota?",
    deleteNoteMessage: "No se puede deshacer.",

    appName: "Aplicación de intérprete",
    loginIntro: "Inicia sesión o crea una cuenta para continuar.",
    loginButton: "Inicia sesión o crea una cuenta",
    skip: "Omitir",
  },
} as const;

// De tre spraken man kan valja i appen.
export const uiLanguages = [
  { code: "en", label: "English" },
  { code: "sv", label: "Svenska" },
  { code: "es", label: "Español" },
] as const;

export type UiLanguage = (typeof uiLanguages)[number]["code"];

// Alla texter finns i engelska, sa den listan bestammer vilka namn som finns.
export type TextKey = keyof typeof translations.en;
