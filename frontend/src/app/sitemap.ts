import { MetadataRoute } from 'next';
import { locales } from '../../i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://whatismyip.com';
  
  // Base pages for each locale
  const pages = [
    '',
    '/ip-location',
    '/port-checker',
    '/dns-lookup',
    '/whois-lookup',
    '/ping-test',
    '/tools',
    '/blog',
    '/api',
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  // Generate sitemap entries for each locale
  locales.forEach(locale => {
    pages.forEach(page => {
      sitemap.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : page === '/ip-location' ? 0.9 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map(loc => [loc, `${baseUrl}/${loc}${page}`])
          )
        }
      });
    });
  });

  return sitemap;
} 