import { generateMetadata as generateMeta } from '@/lib/metadata';
import PrivacyClient from './PrivacyClient';

export const metadata = generateMeta({
  title: "Privacy Policy - WhatIsMyIP",
  description: "Our privacy policy explains how we collect, use, and protect your personal information in compliance with GDPR and other privacy regulations.",
  h1: "Privacy Policy",
  keywords: "privacy policy, data protection, GDPR, personal information, cookies",
  canonical: "https://whatismyip.com/privacy-policy"
});

export default function PrivacyPolicyPage() {
  return <PrivacyClient />;
}
