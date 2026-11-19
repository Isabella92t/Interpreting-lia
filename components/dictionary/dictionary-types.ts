export type WordCategory = {
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
