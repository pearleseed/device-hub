// Supported languages: English, Japanese, Vietnamese
export const LANGUAGES = {
  en: { name: "English", nativeName: "English", flag: "🇺🇸" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  vi: { name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
} as const;

export type Language = keyof typeof LANGUAGES;
export type LanguageInfo = (typeof LANGUAGES)[Language];

export interface TranslationData {
  [key: string]: string;
}

// Storage key for persisting language preference
export const LANGUAGE_STORAGE_KEY = "device-hub-language";
