
import React, { createContext, useState, useContext } from 'react';

const translations = {
  en: {
    importing: 'Importing...',
    importCSV: 'Import CSV',
    sourcedBy: 'Sourced By',
    repaymentAmount: 'Repayment Amount'
  },
  // Add other languages as needed
};

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
