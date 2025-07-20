import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import TracerouteClient from './traceroute-client';

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.traceroute);

export default function TraceroutePage() {
  const tracerouteSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Traceroute Tool",
    "description": "Trace the network path to any destination and see all intermediate hops with response times",
    "url": "https://whatismyip.com/traceroute",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "Network Traceroute Tool",
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
          __html: JSON.stringify(tracerouteSchema),
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            {/* SEO H1 Tag */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {pageMetadata.traceroute.h1}
            </h1>
            <p className="text-xl text-muted-foreground">
              Trace the network path to any destination and see all intermediate hops with response times
            </p>
            
            {/* SEO: Added description about traceroute functionality */}
            <div className="max-w-3xl mx-auto mt-6 text-sm text-muted-foreground">
              <p>
                Traceroute is a network diagnostic tool that shows the path packets take from your computer to a destination server. 
                It reveals each router or hop along the way and measures response times, helping identify network bottlenecks, 
                routing issues, and connection problems.
              </p>
            </div>
          </div>

          {/* Client-side interactive component */}
          <TracerouteClient />
        </div>
      </div>
    </>
  );
} 