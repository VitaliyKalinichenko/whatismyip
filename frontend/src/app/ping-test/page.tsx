import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import PingTestClient from './ping-test-client';

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.pingTest);

export default function PingTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            {/* SEO H1 Tag */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {pageMetadata.pingTest.h1}
            </h1>
            <p className="text-xl text-muted-foreground">
              Test network connectivity and measure round-trip time to any host
            </p>
          </div>

          {/* Client-side interactive component */}
          <PingTestClient />
        </div>
      </div>
  );
} 