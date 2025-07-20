import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import IPv6TestClient from './ipv6-test-client';

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.ipv6Test);

export default function IPv6TestPage() {
  const ipv6Schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "IPv6 Connectivity Test",
    "description": "Test your IPv6 internet connection support and compatibility",
    "url": "https://whatismyip.com/ipv6-test",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "IPv6 Connectivity Test Tool",
      "applicationCategory": "NetworkingApplication",
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
          __html: JSON.stringify(ipv6Schema),
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            {/* SEO H1 Tag */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {pageMetadata.ipv6Test.h1}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Test your IPv6 connectivity and compatibility. Check if your network supports the next-generation Internet Protocol.
            </p>
          </div>

          {/* Client-side interactive component */}
          <IPv6TestClient />
        </div>
      </div>
    </>
  );
}
