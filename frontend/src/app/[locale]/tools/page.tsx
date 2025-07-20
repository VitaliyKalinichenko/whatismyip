import { getTranslations } from 'next-intl/server';
import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Shield, 
  Search, 
  Zap, 
  Network, 
  Globe,
  ArrowRight,
  Wifi,
  Server,
  Eye,
  Route,
  Mail,
  Globe2
} from "lucide-react";
import Link from "next/link";

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.tools);

export default async function ToolsPage() {
  const t = await getTranslations('tools');

  const tools = [
    {
      title: t('tools.ipLocation.title'),
      description: t('tools.ipLocation.description'),
      icon: MapPin,
      href: "/ip-location",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: t('tools.portChecker.title'),
      description: t('tools.portChecker.description'),
      icon: Shield,
      href: "/port-checker",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: t('tools.dnsLookup.title'),
      description: t('tools.dnsLookup.description'),
      icon: Search,
      href: "/dns-lookup",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: t('tools.whoisLookup.title'),
      description: t('tools.whoisLookup.description'),
      icon: Network,
      href: "/whois-lookup",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: t('tools.pingTest.title'),
      description: t('tools.pingTest.description'),
      icon: Wifi,
      href: "/ping-test",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    // HIDDEN TOOLS - NOT READY FOR USERS YET
    // {
    //   title: "Speed Test",
    //   description: "Test your internet connection speed with download and upload measurements",
    //   icon: Zap,
    //   href: "/speedtest",
    //   color: "text-yellow-600",
    //   bgColor: "bg-yellow-50"
    // },
    // {
    //   title: "Traceroute",
    //   description: "Trace the network path to any destination and see all intermediate hops",
    //   icon: Route,
    //   href: "/traceroute",
    //   color: "text-cyan-600",
    //   bgColor: "bg-cyan-50"
    // },
    // {
    //   title: "IP Blacklist Check",
    //   description: "Check if your IP address is blacklisted in spam databases",
    //   icon: Eye,
    //   href: "/blacklist-check",
    //   color: "text-orange-600",
    //   bgColor: "bg-orange-50"
    // },
    // {
    //   title: "Email Blacklist Check",
    //   description: "Check if your email domain or IP is blacklisted in spam databases",
    //   icon: Mail,
    //   href: "/email-blacklist",
    //   color: "text-pink-600",
    //   bgColor: "bg-pink-50"
    // },
    // {
    //   title: "IPv6 Test",
    //   description: "Test your IPv6 connectivity and compatibility",
    //   icon: Globe2,
    //   href: "/ipv6-test",
    //   color: "text-violet-600",
    //   bgColor: "bg-violet-50"
    // },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            {/* SEO H1 Tag */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t('tools.title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('tools.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${tool.bgColor} flex items-center justify-center mb-4`}>
                    <tool.icon className={`h-6 w-6 ${tool.color}`} />
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link 
                    href={tool.href}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 w-full group"
                  >
                    Use Tool
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span>About These Tools</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Our networking tools are designed to help you troubleshoot network issues, 
                  analyze domain configurations, and monitor connectivity. All tools run 
                  server-side to provide accurate results.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Real-time data from authoritative sources</li>
                  <li>• Professional-grade network diagnostics</li>
                  <li>• Privacy-focused with no data retention</li>
                  <li>• Free to use for all users</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <span>Professional Tools</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  These tools are used by network administrators, developers, and IT professionals 
                  worldwide. They provide the same functionality as expensive commercial tools.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Enterprise-grade accuracy</li>
                  <li>• Real-time results</li>
                  <li>• No registration required</li>
                  <li>• Cross-platform compatibility</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
} 