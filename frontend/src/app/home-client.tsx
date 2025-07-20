"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountryMap } from "@/components/ui/country-map";
import { logger } from "@/lib/logger";
import { 
  Globe, 
  MapPin, 
  Wifi, 
  Clock, 
  DollarSign, 
  Copy, 
  CheckCircle,
  Loader2,
  Shield,
  Zap,
  Search,
  Network,
  Phone,
  Router,
  Eye,
  EyeOff,
  RefreshCw,
  Monitor
} from "lucide-react";
import Link from "next/link";

interface IPInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  country_code: string;
  isp: string;
  timezone: string;
  currency: string;
  calling_code: string;
  flag: string;
  latitude?: number;
  longitude?: number;
}

interface BrowserInfo {
  name: string;
  version: string;
  os: string;
}

// Function to get flag emoji from country code
const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

interface LocalIPInfo {
  ip: string;
  detected: boolean;
  error?: string;
}

export default function HomePageClient() {
  const t = useTranslations();
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
  const [localIP, setLocalIP] = useState<LocalIPInfo>({ ip: '', detected: false });
  const [loading, setLoading] = useState(true);
  const [showLocalIP, setShowLocalIP] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Use ref to track if data has been fetched to prevent re-fetching on language changes
  const hasFetchedData = useRef(false);

  const detectBrowser = () => {
    const userAgent = navigator.userAgent;
    let browser = { name: "Unknown", version: "Unknown", os: "Unknown" };

    // Detect browser
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
      browser.name = "Chrome";
      const match = userAgent.match(/Chrome\/([0-9.]+)/);
      if (match) browser.version = match[1];
    } else if (userAgent.includes("Firefox")) {
      browser.name = "Firefox";
      const match = userAgent.match(/Firefox\/([0-9.]+)/);
      if (match) browser.version = match[1];
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browser.name = "Safari";
      const match = userAgent.match(/Version\/([0-9.]+)/);
      if (match) browser.version = match[1];
    } else if (userAgent.includes("Edg")) {
      browser.name = "Edge";
      const match = userAgent.match(/Edg\/([0-9.]+)/);
      if (match) browser.version = match[1];
    }

    // Detect OS
    if (userAgent.includes("Windows")) {
      browser.os = "Windows";
    } else if (userAgent.includes("Mac")) {
      browser.os = "macOS";
    } else if (userAgent.includes("Linux")) {
      browser.os = "Linux";
    } else if (userAgent.includes("Android")) {
      browser.os = "Android";
    } else if (userAgent.includes("iOS")) {
      browser.os = "iOS";
    }

    setBrowserInfo(browser);
  };

  const formatTimezoneUTC = (timezone: string) => {
    try {
      const date = new Date();
      const timeZone = timezone;
      
      // Get the UTC offset
      const offsetFormatter = new Intl.DateTimeFormat('en', {
        timeZone,
        timeZoneName: 'longOffset'
      });
      const offsetParts = offsetFormatter.formatToParts(date);
      const offset = offsetParts.find(part => part.type === 'timeZoneName')?.value;
      const utcOffset = offset ? offset.replace('GMT', 'UTC') : '';
      
      // Extract the city/region name from the timezone
      const regionName = timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
      
      // Combine region name with UTC offset
      return `${regionName} (${utcOffset})`;
    } catch (error) {
      return timezone;
    }
  };

  const fetchIPInfo = async () => {
    try {
      setRefreshing(true);
      setLoadingProgress(10);
      
      // Get full IP info directly with fast timeout
      setLoadingProgress(30);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased timeout to 5 seconds
      
      try {
        logger.debug('Making request to /api/v1/ip-info');
        const response = await fetch('/api/v1/ip-info', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        setLoadingProgress(90);
        const data = await response.json();
        logger.debug('IP Info received', data);
        console.log('🔍 IP Info received:', data);
        setIpInfo(data);
        
        // Cache the successful response
        try {
          localStorage.setItem('whatismyip_cached_data', JSON.stringify(data));
          localStorage.setItem('whatismyip_last_fetch', Date.now().toString());
        } catch (error) {
          logger.error('Failed to cache IP data', error);
        }
        
        setLoadingProgress(100);
        setLoading(false);
      } catch (error) {
        clearTimeout(timeoutId);
        
        logger.debug('Main request failed, trying fallback', {
          error: error instanceof Error ? error.message : String(error),
          errorType: typeof error
        });
        
        // If main request fails, skip to external fallback
        logger.debug('Main request failed, trying external fallback');
        throw error;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Error fetching IP info', {
        message: errorMessage,
        stack: errorStack,
        errorType: typeof error,
        errorString: String(error),
        errorObject: error,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Also log to console for immediate debugging
      console.error('IP Info fetch error:', {
        message: errorMessage,
        stack: errorStack,
        error: error
      });
      setLoadingProgress(70);
      
      // Fallback: try to get IP info from external service
      try {
        logger.debug('Trying external fallback to ipapi.co');
        const fallbackResponse = await fetch('https://ipapi.co/json/');
        if (!fallbackResponse.ok) {
          throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
        }
        const fallbackData = await fallbackResponse.json();
        
        setIpInfo({
          ip: fallbackData.ip,
          city: fallbackData.city || 'Unknown',
          region: fallbackData.region || 'Unknown', 
          country: fallbackData.country_name || 'Unknown',
          country_code: fallbackData.country_code || 'XX',
          isp: fallbackData.org || 'Unknown ISP',
          timezone: fallbackData.timezone || 'UTC',
          currency: fallbackData.currency || 'USD',
          calling_code: fallbackData.country_calling_code || '+1',
          flag: fallbackData.country_code || '🌍'
        });
        setLoadingProgress(100);
        setLoading(false);
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        const fallbackErrorStack = fallbackError instanceof Error ? fallbackError.stack : undefined;
        
        logger.error('Fallback IP detection failed', {
          message: fallbackErrorMessage,
          stack: fallbackErrorStack,
          errorType: typeof fallbackError,
          errorString: String(fallbackError),
          errorObject: fallbackError,
          timestamp: new Date().toISOString()
        });
        
        // Also log to console for immediate debugging
        console.error('Fallback IP detection error:', {
          message: fallbackErrorMessage,
          stack: fallbackErrorStack,
          error: fallbackError
        });
        setIpInfo({
          ip: 'Unable to detect',
          city: 'Unknown',
          region: 'Unknown',
          country: 'Unknown', 
          country_code: 'XX',
          isp: 'Unknown ISP',
          timezone: 'UTC',
          currency: 'USD',
          calling_code: '+1',
          flag: '🌍'
        });
        setLoadingProgress(100);
        setLoading(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingProgress(0);
    }
  };

  const getLocalIP = () => {
    return new Promise<string>((resolve) => {
      const rtc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun.services.mozilla.com' }
        ]
      });

      rtc.createDataChannel('');

      rtc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;
          const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
          
          if (ipMatch) {
            const ip = ipMatch[0];
            // Filter for local network IPs
            if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
              rtc.close();
              resolve(ip);
            }
          }
        }
      };

      rtc.createOffer()
        .then(offer => rtc.setLocalDescription(offer))
        .catch(() => resolve(''));

      // Timeout after 5 seconds
      setTimeout(() => {
        rtc.close();
        resolve('');
      }, 5000);
    });
  };



  const detectLocalIP = async () => {
    try {
      setLocalIP({ ip: 'Detecting...', detected: false });
      
      const ip = await getLocalIP();
      
      if (ip) {
        setLocalIP({ ip, detected: true });
      } else {
        setLocalIP({ 
          ip: 'Unable to detect', 
          detected: false, 
          error: 'WebRTC detection failed or blocked' 
        });
      }
    } catch (error) {
      logger.error('Local IP detection error', error);
      setLocalIP({ 
        ip: 'Detection failed', 
        detected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  useEffect(() => {
    // Clear cache to ensure fresh data (temporary fix)
    try {
      localStorage.removeItem('whatismyip_cached_data');
      localStorage.removeItem('whatismyip_last_fetch');
      console.log('🧹 Cache cleared on mount');
    } catch (error) {
      console.log('❌ Failed to clear cache:', error);
    }
    
    // Check if we have cached data in localStorage
    const cachedData = localStorage.getItem('whatismyip_cached_data');
    const lastFetchTime = localStorage.getItem('whatismyip_last_fetch');
    const now = Date.now();
    const cacheAge = lastFetchTime ? now - parseInt(lastFetchTime) : Infinity;
    const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes cache

    if (cachedData && cacheValid) {
      try {
        const parsedData = JSON.parse(cachedData);
        console.log('🔍 Using cached data:', parsedData);
        setIpInfo(parsedData);
        setLoading(false);
        hasFetchedData.current = true;
        logger.debug('Using cached IP data');
        // Still run these non-blocking operations
        detectLocalIP();
        detectBrowser();
        return;
      } catch (error) {
        logger.error('Failed to parse cached data', error);
        // Continue with fresh fetch if cache is invalid
      }
    }

    // Only fetch data if we haven't fetched it before or if cache is invalid
    if (!hasFetchedData.current || !cacheValid) {
      hasFetchedData.current = true;
      fetchIPInfo();
      detectLocalIP();
      detectBrowser();
    } else {
      // If we have fetched data but no valid cache, ensure loading is false
      setLoading(false);
    }

    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        logger.warn('Loading timeout reached, forcing loading state to false');
        setLoading(false);
        setLoadingProgress(0);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array - only run once on mount

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy to clipboard', err);
    }
  };

  const handleRefresh = () => {
    // Clear cache and reset the fetch flag to allow fresh data fetch
    try {
      localStorage.removeItem('whatismyip_cached_data');
      localStorage.removeItem('whatismyip_last_fetch');
      console.log('🧹 Cache cleared for refresh');
    } catch (error) {
      logger.error('Failed to clear cache', error);
    }
    hasFetchedData.current = false;
    setLoading(true);
    setLoadingProgress(0);
    fetchIPInfo();
    detectLocalIP();
  };

  const tools = [
    {
      title: t('home.tools.ipLocation.title'),
      description: t('home.tools.ipLocation.description'),
      icon: MapPin,
      href: "/ip-location",
      color: "text-blue-600"
    },
    {
      title: t('home.tools.portChecker.title'),
      description: t('home.tools.portChecker.description'),
      icon: Shield,
      href: "/port-checker",
      color: "text-green-600"
    },
    {
      title: t('home.tools.dnsLookup.title'),
      description: t('home.tools.dnsLookup.description'),
      icon: Search,
      href: "/dns-lookup",
      color: "text-purple-600"
    },
    {
      title: t('home.tools.whoisLookup.title'),
      description: t('home.tools.whoisLookup.description'),
      icon: Network,
      href: "/whois-lookup",
      color: "text-red-600"
    }
  ];

  // Debug logging
  console.log('🔍 Current state:', { 
    loading, 
    ipInfo, 
    refreshing, 
    loadingProgress,
    hasFetchedData: hasFetchedData.current 
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Detecting your IP address...</p>
          <div className="mt-4 max-w-xs mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(loadingProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {loadingProgress < 30 ? t('common.loading') : 
               loadingProgress < 70 ? 'Fetching location...' : 
               'Almost done...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('home.description')}
        </p>
      </div>

      {/* Main IP Info Card */}
      <div className="max-w-4xl mx-auto mb-12">
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('home.hero.title')}</CardTitle>
            <CardDescription>
              {t('home.hero.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Public IP Address */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Globe className="h-6 w-6 text-blue-500" />
                  <span className="text-sm font-medium text-muted-foreground">{t('home.hero.publicIp')}</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl md:text-4xl font-mono font-bold">
                    {ipInfo?.ip || 'Loading...'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(ipInfo?.ip || '')}
                    className={`ml-2 ${copied ? 'bg-green-50 border-green-200' : ''}`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="ml-1 text-green-600">{t('common.copied')}</span>
                      </>
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              


              {/* Location Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('home.hero.location')}</p>
                    <div className="flex items-center space-x-2">
                      <CountryMap countryCode={ipInfo?.country_code || ''} size="sm" />
                      <div>
                        <p className="font-semibold">{ipInfo?.city}, {ipInfo?.region}</p>
                        <p className="text-sm text-muted-foreground">{ipInfo?.country}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted">
                  <Wifi className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('home.hero.isp')}</p>
                    <p className="font-semibold">{ipInfo?.isp}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('home.hero.timezone')}</p>
                    <p className="font-semibold">
                      {ipInfo?.timezone ? formatTimezoneUTC(ipInfo.timezone) : 'UTC'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted">
                  <Monitor className="h-5 w-5 text-cyan-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('home.hero.browser')}</p>
                    <p className="font-semibold">
                      {browserInfo?.name || 'Unknown'} {browserInfo?.version || ''}
                    </p>
                    <p className="text-sm text-muted-foreground">{browserInfo?.os || 'Unknown OS'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted">
                  <Phone className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('home.hero.callingCode')}</p>
                    <p className="font-semibold">{ipInfo?.calling_code}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted">
                  <DollarSign className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('home.hero.currency')}</p>
                    <p className="font-semibold">{ipInfo?.currency}</p>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="text-center">
                <Button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  size="lg"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {t('common.refresh')} {t('home.hero.title')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tools Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">{t('home.tools.title')}</h2>
          <p className="text-lg text-muted-foreground">
            {t('home.tools.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <tool.icon className={`h-6 w-6 ${tool.color}`} />
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{tool.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <Card className="border-2">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">{t('home.cta.title')}</h3>
            <p className="text-lg text-muted-foreground mb-6">
              {t('home.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/tools">
                  <Network className="h-5 w-5 mr-2" />
                  {t('home.cta.viewAllTools')}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/blog">
                  {t('home.cta.learnMore')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 