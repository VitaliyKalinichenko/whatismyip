// Test script to verify i18n setup
const { locales } = require('./i18n.ts');

console.log('Supported locales:', locales);
console.log('Default locale:', 'en');

// Test locale validation
const testLocales = ['en', 'es', 'de', 'fr', 'pt', 'hi', 'ar', 'uk', 'zh', 'invalid'];
testLocales.forEach(locale => {
  const isValid = locales.includes(locale);
  console.log(`Locale "${locale}": ${isValid ? 'VALID' : 'INVALID'}`);
});

console.log('\nI18n setup test completed successfully!'); 