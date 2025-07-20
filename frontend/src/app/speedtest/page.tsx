import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import SpeedTestClient from './speedtest-client';

// Export metadata for SEO
export const metadata = generateMeta({
  ...pageMetadata.speedTest,
  title: "Frontend-Only Internet Speed Test | WhatIsMyIP",
  description: "Test your internet speed completely in your browser! No backend required - uses public servers worldwide with automatic geolocation and server selection."
});

export default function SpeedTestPage() {
  const speedTestSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Frontend-Only Internet Speed Test",
    "description": "Test your internet connection download speed, upload speed, ping, and jitter completely in your browser without any backend dependencies",
    "url": "https://whatismyip.com/speedtest",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "Frontend-Only Internet Speed Test Tool",
      "applicationCategory": "NetworkingApplication",
      "operatingSystem": "Web Browser",
      "description": "Browser-based speed test using public servers worldwide with automatic geolocation",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "features": [
        "Frontend-only implementation",
        "No backend dependencies",
        "Automatic server selection",
        "Geolocation-based testing",
        "Real-time animated speedometer",
        "Download, upload, ping, and jitter testing"
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(speedTestSchema),
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Frontend-Only Speed Test
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
              Test your internet speed completely in your browser - no backend required!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
              This speed test runs entirely in your browser using public servers worldwide. 
              It automatically detects your location and selects the nearest server for accurate results.
            </p>
          </div>
          
          <SpeedTestClient />
        </div>
      </div>
    </>
  );
} 