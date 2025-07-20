import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';

// Export metadata for SEO
export const metadata = generateMeta({
  title: "Terms of Service - WhatIsMyIP",
  description: "Terms of Service for WhatIsMyIP website and services",
  h1: "Terms of Service",
  canonical: "https://whatismyip.com/terms-of-service",
  keywords: "terms of service, legal, website terms, user agreement"
});

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-muted-foreground">
            Terms governing your use of our website and services
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-8">
            These Terms govern your use of our website. By accessing the site, you agree to these terms.
          </p>

          <h2 className="text-2xl font-semibold mb-4">1. Use of Website</h2>
          <p className="mb-6">
            You agree to:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>Use the site for lawful purposes only</li>
            <li>Not to attempt to hack, overload, or disrupt the service</li>
            <li>Not to use automated tools to scrape or interact with the site in bad faith</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-4">2. Intellectual Property</h2>
          <p className="mb-6">
            All content, design, and code on this site are the property of WhatIsMyIP.world unless otherwise stated. You may not copy or reproduce them without permission.
          </p>

          <h2 className="text-2xl font-semibold mb-4">3. Limitation of Liability</h2>
          <p className="mb-4">
            We make no guarantees regarding:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>The accuracy of geolocation data</li>
            <li>The availability of the service at all times</li>
          </ul>
          <p className="mb-6">
            We are not liable for damages arising from the use or inability to use the website.
          </p>

          <h2 className="text-2xl font-semibold mb-4">4. Analytics & Tracking</h2>
          <p className="mb-6">
            We use analytics tools to understand site usage. See our{' '}
            <a href="/privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>{' '}
            for details.
          </p>

          <h2 className="text-2xl font-semibold mb-4">5. Termination</h2>
          <p className="mb-6">
            We reserve the right to block access to any user or IP address suspected of abuse, automated scraping, or violation of terms.
          </p>

          <h2 className="text-2xl font-semibold mb-4">6. Governing Law</h2>
          <p className="mb-6">
            These terms are governed by the laws of the United States. Disputes shall be settled in the courts of the United States.
          </p>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 