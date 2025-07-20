'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { locales, localeMetadata } from '../../i18n';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Try to use NextIntl hooks, fallback to defaults if not available
  let t: any;
  let nextIntlLocale: string;
  
  try {
    t = useTranslations('navigation');
    nextIntlLocale = useLocale();
  } catch (error) {
    // Fallback for when NextIntl context is not available
    t = {};
    nextIntlLocale = 'en'; // Default to English
  }

  // Detect current locale from pathname using useMemo for better performance
  const currentLocale = useMemo(() => {
    // Extract locale from pathname
    const pathSegments = pathname.split('/').filter(Boolean);
    const detectedLocale = pathSegments[0];
    
    // Check if the first segment is a valid locale
    if (locales.includes(detectedLocale as any)) {
      return detectedLocale;
    }
    
    // If no valid locale in pathname, use the NextIntl locale or default to 'en'
    return nextIntlLocale || 'en';
  }, [pathname, nextIntlLocale]);

  // Check if we're on the homepage (only show language switcher on homepage)
  const isHomepage = useMemo(() => {
    return pathname === '/' || 
           pathname === `/${currentLocale}` || 
           pathname === `/${currentLocale}/` ||
           // Also check if the pathname matches any locale root
           locales.some(loc => pathname === `/${loc}` || pathname === `/${loc}/`);
  }, [pathname, currentLocale]);
  
  // Don't render the language switcher if not on homepage
  if (!isHomepage) {
    return null;
  }

  const handleLanguageChange = (newLocale: string) => {
    // For homepage, just navigate to the new locale root
    const newPath = `/${newLocale}`;
    router.push(newPath);
    setIsOpen(false);
  };

  const currentLocaleMetadata = localeMetadata[currentLocale as keyof typeof localeMetadata];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLocaleMetadata?.flag}</span>
        <span className="hidden md:inline">{currentLocaleMetadata?.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-background shadow-lg z-50">
          <div className="py-1">
            {locales.map((loc) => {
              const metadata = localeMetadata[loc as keyof typeof localeMetadata];
              return (
                <button
                  key={loc}
                  onClick={() => handleLanguageChange(loc)}
                  className={`w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-3 ${
                    currentLocale === loc ? 'bg-accent' : ''
                  }`}
                >
                  <span className="text-lg">{metadata?.flag}</span>
                  <span>{metadata?.name}</span>
                  {currentLocale === loc && (
                    <span className="ml-auto text-xs text-muted-foreground">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 