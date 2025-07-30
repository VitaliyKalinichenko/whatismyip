const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1) Skip ESLint checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 2) Skip TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Only use standalone output in production
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  
  // Security-focused compilation options
  productionBrowserSourceMaps: false, // Disable source maps in production
  poweredByHeader: false, // Remove X-Powered-By header
  
  // Enhanced compiler options for security
  compiler: {
    // Remove console statements in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'], // Keep only error logs for debugging
    } : false,
    
    // Minify and obfuscate React components
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-test']
    } : false,
  },
  
  images: {
    domains: ['localhost', 'whatismyip.com', '*.vercel.app', '*.render.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: 'default',
    path: '/_next/image/',
  },
  
  // Environment variables (only expose what's necessary)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), location=(), geolocation=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://eu.i.posthog.com https://app.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://eu.i.posthog.com https://app.posthog.com https://api.ipify.org https://ipapi.co https://ip-api.com https://api.ipgeolocation.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://eu.i.posthog.com https://app.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://eu.i.posthog.com https://app.posthog.com https://api.ipify.org https://ipapi.co https://ip-api.com https://api.ipgeolocation.io ws://localhost:* http://localhost:*; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);


