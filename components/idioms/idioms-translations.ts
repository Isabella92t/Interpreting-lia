export type IdiomUiKey =
  | "required"
  | "languagesMissing"
  | "duplicate"
  | "saveFailed"
  | "loadThirdFailed"
  | "editFailed"
  | "deleteTitle"
  | "deleteMessage"
  | "cancel"
  | "delete"
  | "deleteFailed"
  | "showSide"
  | "showStacked"
  | "side"
  | "stacked"
  | "showInfo"
  | "editItem"
  | "addIdiom"
  | "info"
  | "closeInfo"
  | "close"
  | "optional"
  | "optionalInfo"
  | "add"
  | "saving"
  | "editIdiom"
  | "idiomPlaceholder"
  | "translationPlaceholder"
  | "infoOptional";

export const IDIOM_UI: Record<
  "sv" | "en" | "es",
  Record<IdiomUiKey, string>
> = {
  sv: {
    required: "Fyll i idiomet och översättningen.",
    languagesMissing: "Språken kunde inte hittas.",
    duplicate: "Det här idiomet finns redan.",
    saveFailed: "Kunde inte spara idiomet. Försök igen.",
    loadThirdFailed: "Kunde inte läsa översättningen. Försök öppna igen.",
    editFailed: "Kunde inte spara ändringarna. Försök igen.",
    deleteTitle: "Radera idiom?",
    deleteMessage: "Vill du verkligen radera",
    cancel: "Avbryt",
    delete: "Radera",
    deleteFailed: "Kunde inte radera idiomet. Försök igen.",
    showSide: "Visa idiom bredvid varandra",
    showStacked: "Visa idiom under varandra",
    side: "Bredvid varandra",
    stacked: "Under varandra",
    showInfo: "Visa info om",
    editItem: "Redigera",
    addIdiom: "Lägg till idiom",
    info: "Info",
    closeInfo: "Stäng information",
    close: "Stäng",
    optional: "valfritt",
    optionalInfo: "Information (valfritt)",
    add: "Lägg till",
    saving: "Sparar...",
    editIdiom: "Redigera idiom",
    idiomPlaceholder: "Idiom eller uttryck...",
    translationPlaceholder: "Översättning...",
    infoOptional: "Info (valfritt)",
  },
  en: {
    required: "Enter the idiom and its translation.",
    languagesMissing: "The languages could not be found.",
    duplicate: "This idiom already exists.",
    saveFailed: "Could not save the idiom. Please try again.",
    loadThirdFailed: "Could not load the translation. Please open it again.",
    editFailed: "Could not save the changes. Please try again.",
    deleteTitle: "Delete idiom?",
    deleteMessage: "Are you sure you want to delete",
    cancel: "Cancel",
    delete: "Delete",
    deleteFailed: "Could not delete the idiom. Please try again.",
    showSide: "Show idioms side by side",
    showStacked: "Show idioms vertically",
    side: "Side by side",
    stacked: "Vertically",
    showInfo: "Show info about",
    editItem: "Edit",
    addIdiom: "Add idiom",
    info: "Info",
    closeInfo: "Close information",
    close: "Close",
    optional: "optional",
    optionalInfo: "Information (optional)",
    add: "Add",
    saving: "Saving...",
    editIdiom: "Edit idiom",
    idiomPlaceholder: "Idiom or expression...",
    translationPlaceholder: "Translation...",
    infoOptional: "Info (optional)",
  },
  es: {
    required: "Introduce el modismo y su traducción.",
    languagesMissing: "No se encontraron los idiomas.",
    duplicate: "Este modismo ya existe.",
    saveFailed: "No se pudo guardar el modismo. Inténtalo de nuevo.",
    loadThirdFailed:
      "No se pudo cargar la traducción. Intenta abrirla de nuevo.",
    editFailed: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
    deleteTitle: "¿Eliminar modismo?",
    deleteMessage: "¿Seguro que quieres eliminar",
    cancel: "Cancelar",
    delete: "Eliminar",
    deleteFailed: "No se pudo eliminar el modismo. Inténtalo de nuevo.",
    showSide: "Mostrar modismos uno al lado del otro",
    showStacked: "Mostrar modismos uno debajo del otro",
    side: "Uno al lado del otro",
    stacked: "Uno debajo del otro",
    showInfo: "Ver información sobre",
    editItem: "Editar",
    addIdiom: "Añadir modismo",
    info: "Información",
    closeInfo: "Cerrar información",
    close: "Cerrar",
    optional: "opcional",
    optionalInfo: "Información (opcional)",
    add: "Añadir",
    saving: "Guardando...",
    editIdiom: "Editar modismo",
    idiomPlaceholder: "Modismo o expresión...",
    translationPlaceholder: "Traducción...",
    infoOptional: "Información (opcional)",
  },
};
