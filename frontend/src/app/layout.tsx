import { ThemeProvider } from '@/components/theme-provider';
import { SecurityInitializer } from '@/components/security-initializer';
import GDPRConsent from '@/components/gdpr-cookie-consent';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { NextIntlClientProvider } from 'next-intl';
import '@/app/globals.css';

// Default messages for the root layout (fallback)
const defaultMessages = {
  navigation: {
    ipLocation: 'IP Location',
    portChecker: 'Port Checker',
    dnsLookup: 'DNS Lookup',
    tools: 'Tools',
    blog: 'Blog'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <NextIntlClientProvider messages={defaultMessages} locale="en">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SecurityInitializer />
            <div className="min-h-screen bg-background">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <GDPRConsent />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

