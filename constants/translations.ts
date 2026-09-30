// All text som visas i appen samlas här, ett språk i varje objekt.
// Vill man ändra en text så ändrar man den bara på ett ställe.
//
// Engelska är standard. Om en text saknas i sv eller es
// visas den engelska texten istället.

export const translations = {
  en: {
    // Språkäljaren
    appLanguage: "App language",

    // Första sidan
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
    fillTwoLanguages: "Fill in at least two languages",
    fillTwoLanguagesHelp: "You can choose any two or three languages.",
    categoryExists: "The category already exists",
    categoryAdded: "Category added",
    categorySaveFailed: "Could not save the category",
    categorySaveFailedHelp: "Something went wrong while saving.",
    addCategory: "Add category",
    categoryNameSv: "Category name in Swedish",
    categoryNameEn: "Category name in English",
    categoryNameEs: "Category name in Spanish",
    add: "Add",
    cancel: "Cancel",
    fillAllFields: "Please fill in all fields",
    languagesNotFound: "Could not find the languages",
    wordAdded: "The word has been added!",

    // Kategorier

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

    // Flashcards
    flashcards: "Flashcards",
    chooseCategory: "Choose a category",
    allWords: "All words",
    chooseWords: "Choose words",
    myLists: "My lists",
    newList: "New list",
    listName: "List name",
    noLists: "You have no lists yet",
    deleteListTitle: "Delete this list?",
    selectAll: "All",
    selectNone: "None",
    randomTwenty: "Random 20",
    practise: "Practise",
    tapToFlip: "Tap the card to see the answer",
    iKnew: "I knew it",
    iDidNotKnow: "I did not know",
    finished: "Done!",
    correct: "Correct",
    wrong: "Wrong",
    practiseWrong: "Practise the wrong ones",
    practiseAll: "Practise all again",
    noWordsHere: "No words in this category",
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
    categoryOptional:
      "Valfritt – välj ingen kategori för att lägga ordet i Övrigt.",
    fillTwoLanguages: "Fyll i minst två språk",
    fillTwoLanguagesHelp: "Du kan välja vilka två eller tre språk du vill använda.",
    categoryExists: "Kategorin finns redan",
    categoryAdded: "Kategori tillagd",
    categorySaveFailed: "Kunde inte spara kategorin",
    categorySaveFailedHelp: "Något gick fel när kategorin skulle sparas.",
    addCategory: "Lägg till kategori",
    categoryNameSv: "Kategorinamn på svenska",
    categoryNameEn: "Kategorinamn på engelska",
    categoryNameEs: "Kategorinamn på spanska",
    add: "Lägg till",
    cancel: "Avbryt",
    fillAllFields: "Fyll i alla fält",
    languagesNotFound: "Språken kunde inte hittas",
    wordAdded: "Ordet har lagts till!",

    // Kategorier

    words: "ord",
    noWordsYet: "Inga ord här än",

    myNotes: "Mina anteckningar",
    noNotesYet:
      "Du har inga anteckningar än.\nTryck på + för att skriva din första.",
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

    // Flashcards
    flashcards: "Flashcards",
    chooseCategory: "Välj en kategori",
    allWords: "Alla ord",
    chooseWords: "Välj ord",
    myLists: "Mina listor",
    newList: "Ny lista",
    listName: "Listans namn",
    noLists: "Du har inga listor än",
    deleteListTitle: "Ta bort listan?",
    selectAll: "Alla",
    selectNone: "Inga",
    randomTwenty: "Slumpa 20",
    practise: "Öva",
    tapToFlip: "Tryck på kortet för att se svaret",
    iKnew: "Jag kunde",
    iDidNotKnow: "Jag kunde inte",
    finished: "Klart!",
    correct: "Rätt",
    wrong: "Fel",
    practiseWrong: "Öva på de du hade fel",
    practiseAll: "Öva alla igen",
    noWordsHere: "Inga ord i den här kategorin",
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
    categoryOptional: "Opcional: si no eliges ninguna, la palabra va a Övrigt.",
    fillTwoLanguages: "Rellena al menos dos idiomas",
    fillTwoLanguagesHelp: "Puedes elegir dos o tres idiomas cualesquiera.",
    categoryExists: "La categoría ya existe",
    categoryAdded: "Categoría añadida",
    categorySaveFailed: "No se pudo guardar la categoría",
    categorySaveFailedHelp: "Algo salió mal al guardar.",
    addCategory: "Añadir categoría",
    categoryNameSv: "Nombre de categoría en sueco",
    categoryNameEn: "Nombre de categoría en inglés",
    categoryNameEs: "Nombre de categoría en español",
    add: "Añadir",
    cancel: "Cancelar",
    fillAllFields: "Rellena todos los campos",
    languagesNotFound: "No se encontraron los idiomas",
    wordAdded: "¡La palabra se ha añadido!",

    // Kategorier

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

    // Flashcards
    flashcards: "Tarjetas",
    chooseCategory: "Elige una categoría",
    allWords: "Todas las palabras",
    chooseWords: "Elige palabras",
    myLists: "Mis listas",
    newList: "Nueva lista",
    listName: "Nombre de la lista",
    noLists: "Aún no tienes listas",
    deleteListTitle: "¿Eliminar esta lista?",
    selectAll: "Todas",
    selectNone: "Ninguna",
    randomTwenty: "20 al azar",
    practise: "Practicar",
    tapToFlip: "Toca la tarjeta para ver la respuesta",
    iKnew: "Lo sabía",
    iDidNotKnow: "No lo sabía",
    finished: "¡Listo!",
    correct: "Correctas",
    wrong: "Incorrectas",
    practiseWrong: "Practica las incorrectas",
    practiseAll: "Practicar todas otra vez",
    noWordsHere: "No hay palabras en esta categoría",
  },
} as const;

// De tre språken man kan välja i appen.
export const uiLanguages = [
  { code: "en", label: "English" },
  { code: "sv", label: "Svenska" },
  { code: "es", label: "Español" },
] as const;

export type UiLanguage = (typeof uiLanguages)[number]["code"];

// Alla texter finns i engelska, så den listan bestämmer vilka namn som finns.
export type TextKey = keyof typeof translations.en;
