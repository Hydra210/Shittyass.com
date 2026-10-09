import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import messages, { type Language } from './messages';

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

function readLanguage(): Language {
  try {
    const stored = window.localStorage.getItem('shittyass-language');
    return stored === 'es' || stored === 'fr' ? stored : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readLanguage);
  const setLanguage = (value: Language) => {
    setLanguageState(value);
    try { window.localStorage.setItem('shittyass-language', value); } catch { /* browser storage is optional */ }
  };
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key) => messages[language][key] ?? messages.en[key] ?? key,
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
