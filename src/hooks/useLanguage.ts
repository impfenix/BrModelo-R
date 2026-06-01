import { useState, useEffect } from 'react';
import { Language, translations } from '../i18n';

export const useLanguage = () => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('language', lang);
  }, [lang]);

  const t = (key: string) => {
    return (translations[lang] as any)[key] || (translations['pt'] as any)[key];
  };

  return { lang, setLang, t };
};
