import { notFound } from 'next/navigation';
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

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function TermsOfServicePage({ params }: Props) {
  const { locale } = await params;
  
  // Terms of Service доступні лише англійською
  if (locale !== 'en') {
    notFound();
  }

  return <TermsClient />;
}
