import { getTranslations } from 'next-intl/server';
import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import ToolsClient from './ToolsClient';

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.tools);

export default async function ToolsPage() {
  const t = await getTranslations('tools');

  const tools = [
    {
      title: t('ipLocation.title'),
      description: t('ipLocation.description'),
      icon: 'MapPin',
      href: '/ip-location',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('portChecker.title'),
      description: t('portChecker.description'),
      icon: 'Shield',
      href: '/port-checker',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('dnsLookup.title'),
      description: t('dnsLookup.description'),
      icon: 'Search',
      href: '/dns-lookup',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: t('whoisLookup.title'),
      description: t('whoisLookup.description'),
      icon: 'Network',
      href: '/whois-lookup',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: t('pingTest.title'),
      description: t('pingTest.description'),
      icon: 'Wifi',
      href: '/ping-test',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const title = t('title');
  const description = t('description');

  return (
    <ToolsClient
      tools={tools}
      title={title}
      description={description}
    />
  );
}

