// Alla språk som ord och idiom kan sparas på.
//
// Vill du lägga till ett språk i framtiden: lägg till en rad här.
// Språket läggs då in i databasen när appen startar, och det
// syns som en "+"-knapp när man lägger till ett ord eller idiom.
//
// code: kort kod, samma som används i from och to.
// name: namnet i tabellen languages i databasen.
export const WORD_LANGUAGES = [
  { code: "sv", name: "Svenska" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
];

// Samma lista som ett uppslag: languageNames["sv"] ger "Svenska".
export const languageNames: Record<string, string> = Object.fromEntries(
  WORD_LANGUAGES.map((language) => [language.code, language.name]),
);

// Gör en lista med de fält som är ifyllda.
// Språket man översätter från kommer först, sedan språket man
// översätter till och sist de andra språken. Tomma fält tas bort.
export function getFilledLanguages(
  texts: Record<string, string>,
  fromCode: string,
  toCode: string,
) {
  const otherCodes = WORD_LANGUAGES.map((language) => language.code).filter(
    (code) => code !== fromCode && code !== toCode,
  );

  return [fromCode, toCode, ...otherCodes]
    .map((code) => ({ code, text: (texts[code] ?? "").trim() }))
    .filter((entry) => entry.text.length > 0);
}
