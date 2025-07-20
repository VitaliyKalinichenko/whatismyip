import { getTranslations } from 'next-intl/server';
import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import BlogClient from './blog-client';

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.blog);

export default async function BlogPage() {
  const t = await getTranslations('blog');
  
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "WhatIsMyIP Blog",
    "description": "Learn about IP addresses, networking tools, online privacy, cybersecurity, and VPN guides",
    "url": "https://whatismyip.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "WhatIsMyIP",
      "url": "https://whatismyip.com"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* SEO H1 Tag */}
          <h1 className="text-4xl font-bold mb-8 text-center text-foreground">
            {t('title')}
          </h1>
          
          {/* Dynamic Blog Content */}
          <BlogClient />
        </div>
      </div>
    </>
  );
} 