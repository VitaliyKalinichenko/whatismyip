import { Metadata } from 'next';

const baseUrl = 'https://whatismyip.com';

interface PageMetadata {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  h1: string;
  ogImage?: string;
}

export function generateMetadata(pageData: PageMetadata): Metadata {
  return {
    title: pageData.title,
    description: pageData.description,
    keywords: pageData.keywords,
    alternates: {
      canonical: `${baseUrl}${pageData.canonical}`,
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      title: pageData.title,
      description: pageData.description,
      url: `${baseUrl}${pageData.canonical}`,
      siteName: 'WhatIsMyIP',
      images: [
        {
          url: pageData.ogImage || '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${pageData.h1} - whatismyip.world`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageData.title,
      description: pageData.description,
      images: [pageData.ogImage || '/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// Page-specific metadata configurations
export const pageMetadata = {
  home: {
    title: 'What Is My IP — Check Your IP Address & Location',
    description: 'Find your public IP address, ISP, location, timezone, currency, and more. Free IP Checker.',
    keywords: 'what is my ip, ip address, public ip, ip checker, ip location, find my ip, my ip address',
    canonical: '/',
    h1: 'What Is My IP?',
  },
  ipLocation: {
    title: 'IP Location Lookup — Find IP Geolocation',
    description: 'Lookup the geographic location of your IP address. Find city, region, country, timezone.',
    keywords: 'IP location, geolocation, IP address lookup, find IP location, ip geolocation, geographic location',
    canonical: '/ip-location',
    h1: 'IP Location Lookup',
  },
  portChecker: {
    title: 'Open Port Checker — Check Open Ports',
    description: 'Check open TCP ports on your public IP or domain.',
    keywords: 'port checker, open ports, TCP ports, port scanner, check ports, network ports',
    canonical: '/port-checker',
    h1: 'Open Port Checker',
  },
  dnsLookup: {
    title: 'DNS Lookup — Check DNS Records Online',
    description: 'Lookup DNS records (A, MX, TXT, NS, CNAME) for any domain.',
    keywords: 'DNS lookup, DNS records, A record, MX record, CNAME, NS record, TXT record, domain DNS',
    canonical: '/dns-lookup',
    h1: 'DNS Lookup',
  },
  whoisLookup: {
    title: 'Whois Lookup — Domain Whois Checker',
    description: 'Check domain registrar, registration date, expiry, name servers, and contact info.',
    keywords: 'whois lookup, domain whois, domain registration, domain info, whois checker, domain registrar',
    canonical: '/whois-lookup',
    h1: 'Whois Lookup',
  },
  pingTest: {
    title: 'Ping Test — Check Network Latency',
    description: 'Run an online ping test to check latency to a server or website.',
    keywords: 'ping test, network latency, ping checker, server response time, network test, connectivity test',
    canonical: '/ping-test',
    h1: 'Ping Test',
  },
  traceroute: {
    title: 'Traceroute — Find Network Path',
    description: 'Run traceroute to see network hops and latency to any host or IP.',
    keywords: 'traceroute, network path, network hops, route tracer, network diagnostic, path analysis',
    canonical: '/traceroute',
    h1: 'Traceroute',
  },
  blacklistCheck: {
    title: 'IP Blacklist Check — Is Your IP Blacklisted?',
    description: 'Check if your IP address is blacklisted in spam databases or DNSBLs.',
    keywords: 'IP blacklist, blacklist check, DNSBL, spam database, IP reputation, blacklist checker',
    canonical: '/blacklist-check',
    h1: 'IP Blacklist Check',
  },
  emailBlacklist: {
    title: 'Email Blacklist Check — Check Email Reputation',
    description: 'Check if your email domain or IP is blacklisted in spam databases.',
    keywords: 'email blacklist, email reputation, domain blacklist, email spam check, email deliverability',
    canonical: '/email-blacklist',
    h1: 'Email Blacklist Check',
  },
  speedTest: {
    title: 'Speed Test — Check Internet Speed',
    description: 'Test your internet connection download speed, upload speed, ping, and jitter.',
    keywords: 'speed test, internet speed, bandwidth test, download speed, upload speed, connection speed',
    canonical: '/speedtest',
    h1: 'Internet Speed Test',
  },
  ipv6Test: {
    title: 'IPv6 Test — Check IPv6 Connectivity',
    description: 'Check if your internet connection supports IPv6.',
    keywords: 'IPv6 test, IPv6 connectivity, IPv6 support, IPv6 checker, internet protocol v6',
    canonical: '/ipv6-test',
    h1: 'IPv6 Test',
  },
  api: {
    title: 'IP API Documentation — IP, DNS, Whois, Ports API',
    description: 'Access public APIs for IP info, DNS lookup, port checker, and whois.',
    keywords: 'IP API, DNS API, whois API, port checker API, REST API, JSON API, network API',
    canonical: '/api',
    h1: 'API Documentation',
  },
  blog: {
    title: 'Blog — IP, Networking, Privacy & VPN Guides',
    description: 'Read articles about IP, networking tools, online privacy, cybersecurity, and VPN usage.',
    keywords: 'IP blog, networking guides, privacy tips, VPN guides, cybersecurity articles, network security',
    canonical: '/blog',
    h1: 'Blog',
  },
  tools: {
    title: 'Network Tools — Complete IP & Network Testing Suite',
    description: 'Comprehensive collection of network testing and diagnostic tools including IP lookup, DNS checker, port scanner, and more.',
    keywords: 'network tools, network testing, network diagnostics, IP tools, DNS tools, network utilities',
    canonical: '/tools',
    h1: 'Network Tools',
  },
}; 