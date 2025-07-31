import { generateMetadata as generateMeta } from '@/lib/metadata';
import TermsClient from './TermsClient';

// Export metadata for SEO
export const metadata = generateMeta({
  title: "Terms of Service - WhatIsMyIP",
  description: "Terms of Service for WhatIsMyIP website and services",
  h1: "Terms of Service",
  canonical: "https://whatismyip.com/terms-of-service",
  keywords: "terms of service, legal, website terms, user agreement"
});

export default function TermsOfServicePage() {
  return <TermsClient />;
}
