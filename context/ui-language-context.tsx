import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  type TextKey,
  translations,
  type UiLanguage,
} from "@/constants/translations";

// Har sparar vi vilket sprak appen visas pa.
// Obs: det har ar INTE samma sak som fran-/till-spraken i ordboken.
const APP_LANGUAGE_KEY = "appLanguage";

type UiLanguageContextValue = {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
  // t som i "translate". t("save") ger "Save", "Spara" eller "Guardar".
  t: (key: TextKey) => string;
};

const UiLanguageContext = createContext<UiLanguageContextValue | undefined>(
  undefined,
);

export function UiLanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Engelska ar standard.
  const [language, setLanguageState] = useState<UiLanguage>("en");

  // Vi visar inget forran vi vet vilket sprak som ar sparat,
  // annars hinner man se engelska texter blinka forbi.
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadSavedLanguage() {
      try {
        const saved = await AsyncStorage.getItem(APP_LANGUAGE_KEY);

        if (saved && saved in translations) {
          setLanguageState(saved as UiLanguage);
        }
      } catch (error) {
        console.log("Kunde inte lasa appens sprak:", error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadSavedLanguage();
  }, []);

  const setLanguage = useCallback(async (next: UiLanguage) => {
    setLanguageState(next);

    try {
      await AsyncStorage.setItem(APP_LANGUAGE_KEY, next);
    } catch (error) {
      console.log("Kunde inte spara appens sprak:", error);
    }
  }, []);

  const t = useCallback(
    (key: TextKey) => {
      // Saknas texten i valt sprak sa visar vi den engelska.
      return translations[language][key] ?? translations.en[key];
    },
    [language],
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <UiLanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </UiLanguageContext.Provider>
  );
}

export function useUiLanguage() {
  const context = useContext(UiLanguageContext);

  if (!context) {
    throw new Error("useUiLanguage maste anvandas inuti UiLanguageProvider");
  }

  return context;
}
