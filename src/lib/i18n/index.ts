import { useState, useEffect, useCallback } from 'react';
import { en, TranslationKeys } from './en';
import { ta } from './ta';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// i18n — Multi-language support (English + Tamil)
// Persists language choice in localStorage
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type Language = 'en' | 'ta';

export const LANGUAGES: { code: Language; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳' },
];

const translations: Record<Language, Record<string, string>> = { en, ta };

const STORAGE_KEY = 'noe-lang';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// useLanguage Hook — Access and switch language
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useLanguage() {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    if (saved && (saved === 'en' || saved === 'ta')) {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    // Update HTML lang attribute
    document.documentElement.lang = newLang;
  }, []);

  const toggleLang = useCallback(() => {
    const next: Language = lang === 'en' ? 'ta' : 'en';
    setLang(next);
  }, [lang, setLang]);

  // Translation function
  const t = useCallback((key: TranslationKeys): string => {
    return translations[lang]?.[key] || translations['en'][key] || key;
  }, [lang]);

  return {
    lang,           // 'en' | 'ta'
    setLang,        // Set specific language
    toggleLang,     // Quick toggle between en/ta
    t,              // Translate function: t('key')
    isEnglish: lang === 'en',
    isTamil: lang === 'ta',
    languages: LANGUAGES,
  };
}

// Re-export types
export type { TranslationKeys };
