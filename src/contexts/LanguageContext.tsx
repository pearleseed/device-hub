import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  translations,
  LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  type Language,
} from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

// Get initial language from localStorage or browser preference
const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "en";

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && stored in LANGUAGES) return stored as Language;

  // Check browser language preference
  const browserLang = navigator.language.split("-")[0];
  if (browserLang in LANGUAGES) return browserLang as Language;

  return "en";
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Memoize current translations for performance
  const currentTranslations = useMemo(() => translations[language], [language]);

  // Persist language preference and update HTML lang attribute
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, []);

  // Set initial HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Translation function with optional parameter interpolation
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = currentTranslations[key] ?? translations.en[key] ?? key;

      // Simple parameter interpolation: {{param}}
      if (params) {
        // Handle common pluralization suffix {{s}} if count is provided
        const finalParams = { ...params };

        // Handle common pluralization suffix {{s}} if count is provided
        if (typeof finalParams.count === "number" && !("s" in finalParams)) {
          finalParams.s = finalParams.count === 1 ? "" : "s";
        }

        return text.replace(/{{(\w+)}}/g, (match, key) => {
          return finalParams[key] !== undefined ? String(finalParams[key]) : match;
        });
      }

      return text;
    },
    [currentTranslations],
  );

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === LANGUAGE_STORAGE_KEY &&
        e.newValue &&
        e.newValue in LANGUAGES
      ) {
        setLanguageState(e.newValue as Language);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
