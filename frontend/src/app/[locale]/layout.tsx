import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, localeMetadata } from '../../../i18n';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // ✅ FIXED: Properly await the params
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  const messages = await getMessages({ locale });
  const metadata = localeMetadata[locale as keyof typeof localeMetadata];
  const dir = metadata?.dir || 'ltr';

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div dir={dir}>
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
