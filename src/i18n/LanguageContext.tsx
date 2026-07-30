import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { vi } from "./vi";
import { en } from "./en";
import { de } from "./de";

export type Language = "vi" | "en" | "de";

const translations: Record<Language, any> = { vi, en, de };
const LANGUAGE_STORAGE_KEY = "@appLanguage";

type LanguageContextType = {
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  t: (key: string, replacements?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLang && (savedLang === "vi" || savedLang === "en" || savedLang === "de")) {
          setLanguageState(savedLang as Language);
        }
      } catch (e) {
        console.error("Failed to load language", e);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.error("Failed to save language", e);
    }
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let currentDict = translations[language];

    for (const k of keys) {
      if (currentDict && currentDict[k] !== undefined) {
        currentDict = currentDict[k];
      } else {
        // Fallback to Vietnamese translation first
        let fallbackDict = translations["vi"];
        let foundInFallback = true;
        for (const fk of keys) {
          if (fallbackDict && fallbackDict[fk] !== undefined) {
            fallbackDict = fallbackDict[fk];
          } else {
            foundInFallback = false;
            break;
          }
        }
        if (foundInFallback && typeof fallbackDict === "string") {
          currentDict = fallbackDict;
        } else {
          return key; // return the raw key as last resort
        }
        break;
      }
    }

    if (typeof currentDict !== "string") {
      return key;
    }

    let text = currentDict;
    if (replacements) {
      Object.entries(replacements).forEach(([rKey, rVal]) => {
        text = text.replace(new RegExp(`{${rKey}}`, "g"), String(rVal));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
