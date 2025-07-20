import Link from "next/link";
import { Globe, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    tools: [
      { name: "IP Location Lookup", href: "/ip-location" },
      { name: "Port Checker", href: "/port-checker" },
      { name: "DNS Lookup", href: "/dns-lookup" },
      { name: "Whois Lookup", href: "/whois-lookup" },
      // { name: "Speed Test", href: "/speedtest" }, // SEO: Added speed test link - HIDDEN FOR NOW
    ],
    security: [
      { name: "Ping Test", href: "/ping-test" },
      // { name: "Traceroute", href: "/traceroute" }, // SEO: Added traceroute link - HIDDEN FOR NOW
      // { name: "Blacklist Check", href: "/blacklist-check" }, // SEO: Added blacklist check link - HIDDEN FOR NOW
      // { name: "Email Blacklist", href: "/email-blacklist" }, // SEO: Added email blacklist link - HIDDEN FOR NOW
      // { name: "IPv6 Test", href: "/ipv6-test" }, // SEO: Added IPv6 test link - HIDDEN FOR NOW
    ],
    resources: [
      { name: "Blog", href: "/blog" },
      // { name: "API Documentation", href: "/api" }, // SEO: Added API docs link - HIDDEN FOR NOW
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms of Service", href: "/terms-of-service" },
    ],
  };

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold">WhatIsMyIP</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Professional IP address tools and networking utilities for developers, 
              system administrators, and security professionals.
            </p>
            <div className="flex items-center space-x-4">
              <Link href="/contact" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <Mail className="h-5 w-5" />
                <span className="text-sm">Contact Us</span>
              </Link>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="font-semibold mb-4">IP Tools</h3>
            <ul className="space-y-2">
              {footerLinks.tools.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Security */}
          <div>
            <h3 className="font-semibold mb-4">Security</h3>
            <ul className="space-y-2">
              {footerLinks.security.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} WhatIsMyIPWorld. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              href="/privacy-policy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

