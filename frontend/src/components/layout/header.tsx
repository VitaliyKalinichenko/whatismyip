"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import LanguageSwitcher from "@/components/language-switcher";
import { 
  Globe, 
  Moon, 
  Sun, 
  Menu,
  X,
  Shield,
  Zap,
  Search,
  Network
} from "lucide-react";
import { useState, useEffect } from "react";

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('navigation');

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = [
    { name: t('ipLocation'), href: "/ip-location", icon: Globe },
    { name: t('portChecker'), href: "/port-checker", icon: Shield },
    { name: t('dnsLookup'), href: "/dns-lookup", icon: Search },
    // { name: t('speedTest'), href: "/speedtest", icon: Zap }, // SEO: Added speed test link - HIDDEN FOR NOW
    { name: t('tools'), href: "/tools", icon: Network },
    { name: t('blog'), href: "/blog", icon: Network },
  ];

  if (!mounted) {
    return null;
  }

  // Use resolvedTheme to get the actual applied theme
  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Globe className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">WhatIsMyIP</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Theme Toggle & Language Switcher & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Theme Toggle */}
            <div className="flex items-center space-x-2">
              <Moon className={`h-4 w-4 ${isDark ? "text-foreground" : "text-muted-foreground"}`} />
              <Switch
                checked={!isDark}
                onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
                aria-label="Toggle between dark and light mode"
              />
              <Sun className={`h-4 w-4 ${!isDark ? "text-foreground" : "text-muted-foreground"}`} />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
    </header>
  );
}

