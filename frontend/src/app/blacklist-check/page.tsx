import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import BlacklistCheckClient from './blacklist-check-client';

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.blacklistCheck);

export default function BlacklistCheckPage() {
  const blacklistSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "IP Blacklist Checker",
    "description": "Check if your IP address is blacklisted in spam databases or DNSBLs",
    "url": "https://whatismyip.com/blacklist-check",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "IP Blacklist Checker Tool",
      "applicationCategory": "SecurityApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blacklistSchema),
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            {/* SEO H1 Tag */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {pageMetadata.blacklistCheck.h1}
            </h1>
            <p className="text-xl text-muted-foreground">
              Check if an IP address is listed on spam or security blacklists
            </p>
          </div>

          {/* Client-side interactive component */}
          <BlacklistCheckClient />
        </div>
      </div>
    </>
  );
} 