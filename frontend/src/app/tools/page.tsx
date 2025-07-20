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

export default function ToolsPage() {
  const tools = [
    {
      title: "IP Location Lookup",
      description: "Find the geographic location of any IP address with detailed ISP information",
      icon: MapPin,
      href: "/ip-location",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Port Checker",
      description: "Check if specific ports are open on your IP or any remote host",
      icon: Shield,
      href: "/port-checker",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "DNS Lookup",
      description: "Query DNS records for any domain including A, AAAA, MX, NS, TXT records",
      icon: Search,
      href: "/dns-lookup",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Whois Lookup",
      description: "Get domain registration information and ownership details",
      icon: Network,
      href: "/whois-lookup",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Ping Test",
      description: "Test network connectivity and measure round-trip time to any host",
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
              {pageMetadata.tools.h1}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional networking tools for developers, system administrators, and IT professionals. 
              Diagnose network issues, analyze domains, and monitor connectivity.
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
                  All tools provide professional-grade network diagnostics and analysis 
                  for troubleshooting connectivity issues and monitoring network performance.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Real-time network monitoring</li>
                  <li>• Advanced diagnostics capabilities</li>
                  <li>• Comprehensive analysis reports</li>
                  <li>• Easy-to-use interface</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
} 