// Minimal i18n utility for labels.
// Extend messages per-locale as needed.

const messages = {
  en: {
    'table.month': 'Month',
    'table.emis': 'EMIs',
    'table.amountDue': 'Amount Due',
    'table.collected': 'Collected',
    'table.collectionRate': 'Collection Rate',
  },
};

// Resolve current locale (fallback to 'en')
const getLocale = () => {
  try {
    return (localStorage.getItem('locale') || navigator.language || 'en').slice(0, 2);
  } catch (_) {
    return 'en';
  }
};

export const t = (key) => {
  const locale = getLocale();
  const localeMessages = messages[locale] || messages.en;
  return localeMessages[key] || messages.en[key] || key;
};

export default t;