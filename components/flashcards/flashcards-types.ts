export type Category = {
  id: number;
  name: string;
  name_sv: string | null;
  name_en: string | null;
  name_es: string | null;
};

export type Card = {
  word_id: number;
  text_from: string;
  text_to: string;
  // Kategorierna ordet ligger i, t.ex. "Juridik|Migration".
  // Ett ord kan ligga i flera kategorier.
  tag_names?: string | null;
};

export type Deck = {
  id: number;
  name: string;
};

export type Source =
  | { kind: "all" }
  | { kind: "category"; name: string }
  | { kind: "deck"; deck: Deck };

export type Step = "categories" | "words" | "practice" | "result";
