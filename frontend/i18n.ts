import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['en', 'es', 'de', 'fr', 'pt', 'hi', 'ar', 'uk', 'zh'] as const;
export type Locale = typeof locales[number];

// Locale metadata
export const localeMetadata = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr'
  },
  es: {
    name: 'Español',
    flag: '🇪🇸',
    dir: 'ltr'
  },
  de: {
    name: 'Deutsch',
    flag: '🇩🇪',
    dir: 'ltr'
  },
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    dir: 'ltr'
  },
  pt: {
    name: 'Português',
    flag: '🇧🇷',
    dir: 'ltr'
  },
  hi: {
    name: 'हिन्दी',
    flag: '🇮🇳',
    dir: 'ltr'
  },
  ar: {
    name: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl'
  },
  uk: {
    name: 'Українська',
    flag: '🇺🇦',
    dir: 'ltr'
  },
  zh: {
    name: '中文',
    flag: '🇨🇳',
    dir: 'ltr'
  }
} as const;

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) notFound();

  try {
    const messages = (await import(`./messages/${locale}.json`)).default;
    return {
      locale,
      messages
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    notFound();
  }
}); 