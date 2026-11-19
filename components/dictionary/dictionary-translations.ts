const PAGE_TRANSLATIONS: Record<string, { en: string; es: string }> = {
  "Gå vidare och välj vilka ord som ska importeras": {
    en: "Continue to choose which words to import",
    es: "Continúa para elegir las palabras que quieres importar",
  },
  "Välj kategori": { en: "Choose category", es: "Elegir categoría" },
  "Importera från kategori": {
    en: "Import from category",
    es: "Importar desde una categoría",
  },
  "Välj vilken kategori du vill hämta ord från.": {
    en: "Choose a category to import words from.",
    es: "Elige una categoría de la que importar palabras.",
  },
  "Det finns inga andra kategorier att importera från.": {
    en: "There are no other categories to import from.",
    es: "No hay otras categorías desde las que importar.",
  },
  ord: { en: "words", es: "palabras" },
  "✓ Välj hela kategorin": {
    en: "✓ Select entire category",
    es: "✓ Seleccionar toda la categoría",
  },
  "☐ Välj vissa ord": {
    en: "☐ Select specific words",
    es: "☐ Seleccionar algunas palabras",
  },
  "Den här kategorin har inga ord.": {
    en: "This category has no words.",
    es: "Esta categoría no contiene palabras.",
  },
  "Markera orden du vill importera": {
    en: "Select the words you want to import",
    es: "Selecciona las palabras que quieres importar",
  },
  valda: { en: "selected", es: "seleccionadas" },
  "Importera valda": { en: "Import selected", es: "Importar seleccionadas" },
  "‹ Tillbaka": { en: "‹ Back", es: "‹ Volver" },
  "Import klart": { en: "Import complete", es: "Importación completada" },
  "Kunde inte hämta kategorierna.": {
    en: "Could not load the categories.",
    es: "No se pudieron cargar las categorías.",
  },
  "Kunde inte hämta importkategorierna.": {
    en: "Could not load import categories.",
    es: "No se pudieron cargar las categorías para importar.",
  },
  "Kunde inte läsa orden i kategorin.": {
    en: "Could not load the words in the category.",
    es: "No se pudieron cargar las palabras de la categoría.",
  },
  "Importen misslyckades. Försök igen.": {
    en: "Import failed. Please try again.",
    es: "La importación falló. Inténtalo de nuevo.",
  },
  "Vill du verkligen radera ordet?": {
    en: "Do you really want to delete this word?",
    es: "¿Seguro que quieres eliminar esta palabra?",
  },
  valfritt: { en: "optional", es: "opcional" },
  "Visa information om": {
    en: "Show information about",
    es: "Mostrar información sobre",
  },
  "Avsluta redigering": { en: "Finish editing", es: "Terminar edición" },
  "Aktivera redigering": { en: "Enable editing", es: "Activar edición" },
  "Växlar mellan kolumnvisning och visning under varandra": {
    en: "Switches between side-by-side and stacked views",
    es: "Alterna entre vista en columnas y vista vertical",
  },
  "Visa ord bredvid varandra": {
    en: "Show words side by side",
    es: "Mostrar palabras en columnas",
  },
  "Visa ord under varandra": {
    en: "Show words vertically",
    es: "Mostrar palabras en vertical",
  },
  "fler träffar": { en: "more results", es: "resultados más" },
  "Importera ord från en annan kategori": {
    en: "Import words from another category",
    es: "Importar palabras de otra categoría",
  },
  "Redigera ordet": { en: "Edit word", es: "Editar palabra" },
  Redigera: { en: "Edit", es: "Editar" },
  Klar: { en: "Done", es: "Listo" },
  Importera: { en: "Import", es: "Importar" },
  "Lägg till ord": { en: "Add word", es: "Añadir palabra" },
  "Redigera ord": { en: "Edit word", es: "Editar palabra" },
  "Information (valfritt)": {
    en: "Information (optional)",
    es: "Información (opcional)",
  },
  "Kategori (valfritt)": {
    en: "Category (optional)",
    es: "Categoría (opcional)",
  },
  Kategorier: { en: "Categories", es: "Categorías" },
  "Laddar...": { en: "Loading...", es: "Cargando..." },
  Övrigt: { en: "Other", es: "Otros" },
  "Radera ord?": { en: "Delete word?", es: "¿Eliminar palabra?" },
  Avbryt: { en: "Cancel", es: "Cancelar" },
  Radera: { en: "Delete", es: "Eliminar" },
  "Kunde inte lägga till ordet. Försök igen.": {
    en: "Could not add the word. Please try again.",
    es: "No se pudo añadir la palabra. Inténtalo de nuevo.",
  },
  "Kunde inte hämta kategorierna. Försök igen.": {
    en: "Could not load the categories. Please try again.",
    es: "No se pudieron cargar las categorías. Inténtalo de nuevo.",
  },
  "Fyll i både ord och översättning.": {
    en: "Enter both the word and its translation.",
    es: "Introduce la palabra y su traducción.",
  },
  "Språken kunde inte hittas.": {
    en: "The languages could not be found.",
    es: "No se encontraron los idiomas.",
  },
  "Kunde inte spara ändringarna. Försök igen.": {
    en: "Could not save changes. Please try again.",
    es: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
  },
  "Kunde inte radera ordet. Försök igen.": {
    en: "Could not delete the word. Please try again.",
    es: "No se pudo eliminar la palabra. Inténtalo de nuevo.",
  },
};

export function pageText(key: string, language: string) {
  const entry = PAGE_TRANSLATIONS[key];
  return language === "en"
    ? (entry?.en ?? key)
    : language === "es"
      ? (entry?.es ?? key)
      : key;
}
