import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import DNSLookupClient from './dns-lookup-client';

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.dnsLookup);

export default function DNSLookupPage() {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            {/* SEO H1 Tag */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {pageMetadata.dnsLookup.h1}
            </h1>
            <p className="text-xl text-muted-foreground">
              Query DNS records for any domain name
            </p>
          </div>

          {/* Client-side interactive component */}
          <DNSLookupClient />
        </div>
      </div>
  );
} 