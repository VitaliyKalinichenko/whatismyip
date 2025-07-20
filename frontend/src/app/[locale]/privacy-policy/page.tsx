import { generateMetadata as generateMeta } from '@/lib/metadata';

export const metadata = generateMeta({
  title: "Privacy Policy - WhatIsMyIP",
  description: "Our privacy policy explains how we collect, use, and protect your personal information in compliance with GDPR and other privacy regulations.",
  h1: "Privacy Policy",
  keywords: "privacy policy, data protection, GDPR, personal information, cookies",
  canonical: "https://whatismyip.com/privacy-policy"
});

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-8">
            This Privacy Policy explains how we collect, use, and protect your information when you visit our website.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What Information We Collect</h2>
            <ul className="list-disc pl-6 mb-6">
              <li><strong>IP Address:</strong> Automatically collected to determine your location and for analytics purposes.</li>
              <li><strong>Geolocation Data:</strong> Approximate location based on IP address.</li>
              <li><strong>Device & Browser Info:</strong> Collected for site optimization and troubleshooting.</li>
              <li><strong>Event Data:</strong> Pages visited, actions taken — collected via tools like Google Analytics.</li>
            </ul>
            <p className="mb-6">
              We <strong>do not</strong> collect any personally identifiable information (PII) unless explicitly provided.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Data</h2>
            <ul className="list-disc pl-6 mb-6">
              <li>To display your approximate location on the map.</li>
              <li>To improve website performance and functionality.</li>
              <li>To protect the site from abuse (e.g. rate-limiting by IP).</li>
              <li>For internal analytics (e.g., how users interact with our pages).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cookies & Tracking</h2>
            <p className="mb-4">We may use:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Session cookies for basic functionality</li>
              <li>Analytics cookies (e.g. Google Analytics) to understand user behavior</li>
            </ul>
            <p className="mb-6">
              You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage & Security</h2>
            <ul className="list-disc pl-6 mb-6">
              <li>All analytics data is stored securely on EU-based servers.</li>
              <li>IPs are used temporarily and not stored longer than necessary.</li>
              <li>Access to collected data is restricted and protected.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Third Parties</h2>
            <p className="mb-4">We may use the following services:</p>
            <ul className="list-disc pl-6 mb-6">
              <li><strong>Vercel</strong> (hosting)</li>
              <li><strong>Google Analytics</strong> (analytics)</li>
              <li><strong>Cloudflare or IP services</strong> for geolocation</li>
            </ul>
            <p className="mb-6">
              Each of these services follows its own privacy and data handling policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights (GDPR/CCPA)</h2>
            <p className="mb-4">
              If you're a resident of the EU or California, you have the right to:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>Request access or deletion of your data</li>
              <li>Opt out of analytics tracking</li>
              <li>Lodge a complaint with your data protection authority</li>
            </ul>
            <p className="mb-6">
              Contact us at <strong>privacy@whatismyip.com</strong> to make such requests.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Changes to This Policy</h2>
            <p className="mb-6">
              We may update this Privacy Policy from time to time. Updates will be posted on this page.
            </p>
          </section>

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