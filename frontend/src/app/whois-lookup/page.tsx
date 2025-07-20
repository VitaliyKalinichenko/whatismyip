import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import WhoisLookupClient from './whois-lookup-client';

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.whoisLookup);

export default function WhoisLookupPage() {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            {/* SEO H1 Tag */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {pageMetadata.whoisLookup.h1}
            </h1>
            <p className="text-xl text-muted-foreground">
              Check domain registration details including registrar, creation date, expiry, name servers, and contact information
            </p>
            
            {/* SEO: Added description about WHOIS lookup functionality */}
            <div className="max-w-3xl mx-auto mt-6 text-sm text-muted-foreground">
              <p>
                WHOIS is a protocol that provides information about domain registrations. Our tool queries official WHOIS databases 
                to retrieve domain ownership details, registration dates, expiration dates, and nameserver information. This helps 
                verify domain legitimacy and contact domain owners.
              </p>
            </div>
          </div>

          {/* Client-side interactive component */}
          <WhoisLookupClient />
        </div>
      </div>
  );
} 