import { getTranslations } from 'next-intl/server';
import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import ToolsClient from './ToolsClient';

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.tools);

export default async function ToolsPage() {
  const t = await getTranslations('tools');

  // Prepare translated strings and tool definitions on the server
  const tools = [
    {
      title: t('tools.ipLocation.title'),
      description: t('tools.ipLocation.description'),
      icon: 'MapPin',
      href: '/ip-location',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('tools.portChecker.title'),
      description: t('tools.portChecker.description'),
      icon: 'Shield',
      href: '/port-checker',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('tools.dnsLookup.title'),
      description: t('tools.dnsLookup.description'),
      icon: 'Search',
      href: '/dns-lookup',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: t('tools.whoisLookup.title'),
      description: t('tools.whoisLookup.description'),
      icon: 'Network',
      href: '/whois-lookup',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: t('tools.pingTest.title'),
      description: t('tools.pingTest.description'),
      icon: 'Wifi',
      href: '/ping-test',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  // Page-level translations
  const title = t('tools.title');
  const description = t('tools.description');

  return (
    <ToolsClient
      tools={tools}
      title={title}
      description={description}
    />
  );
}
