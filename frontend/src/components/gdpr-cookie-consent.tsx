'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Cookie, Settings, Check } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function GDPRCookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    setMounted(true);
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
      // Apply analytics based on consent
      if (savedPreferences.analytics) {
        enableAnalytics();
      }
    }
  }, []);

  const enableAnalytics = () => {
    // Import and use PostHog functions
    if (typeof window !== 'undefined') {
      import('@/app/instrumentation.client').then(({ initializePostHog }) => {
        initializePostHog();
      });
    }
  };

  const disableAnalytics = () => {
    // Import and use PostHog functions
    if (typeof window !== 'undefined') {
      import('@/app/instrumentation.client').then(({ disablePostHog }) => {
        disablePostHog();
      });
    }
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    
    setPreferences(allAccepted);
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    enableAnalytics();
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    
    setPreferences(necessaryOnly);
    localStorage.setItem('cookie-consent', JSON.stringify(necessaryOnly));
    disableAnalytics();
    setShowBanner(false);
    setShowSettings(false);
  };

  const savePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    
    if (preferences.analytics) {
      enableAnalytics();
    } else {
      disableAnalytics();
    }
    
    setShowBanner(false);
    setShowSettings(false);
  };

  const togglePreference = (type: keyof CookiePreferences) => {
    if (type === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted || !showBanner) return null;

  return (
    <>
      {/* Main minimal banner */}
      {!showSettings && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Cookie className="h-4 w-4 text-white/80 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-xs leading-relaxed">
                    🍪 We use cookies to improve your experience. 
                    <a href="/privacy-policy" className="text-blue-300 hover:text-blue-200 underline ml-1">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button 
                  onClick={acceptAll} 
                  size="sm" 
                  className="bg-white/20 hover:bg-white/30 text-white text-xs h-7 px-3 border-white/20"
                >
                  Accept All
                </Button>
                <Button 
                  onClick={acceptNecessary} 
                  variant="outline" 
                  size="sm" 
                  className="text-white/80 hover:text-white border-white/20 hover:bg-white/10 text-xs h-7 px-3"
                >
                  Necessary Only
                </Button>
                <Button 
                  onClick={() => setShowSettings(true)} 
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white hover:bg-white/10 h-7 w-7 p-0"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal - only show when needed */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Cookie Preferences</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex-1">
                  <h4 className="font-medium text-xs">Necessary Cookies</h4>
                  <p className="text-xs text-muted-foreground">
                    Essential for basic functionality
                  </p>
                </div>
                <div className="flex items-center ml-2">
                  <Check className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-muted-foreground">Always active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex-1">
                  <h4 className="font-medium text-xs">Analytics Cookies</h4>
                  <p className="text-xs text-muted-foreground">
                    Google Analytics for website insights
                  </p>
                </div>
                <Button
                  variant={preferences.analytics ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePreference('analytics')}
                  className="text-xs h-7 px-2 ml-2"
                >
                  {preferences.analytics ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex-1">
                  <h4 className="font-medium text-xs">Marketing Cookies</h4>
                  <p className="text-xs text-muted-foreground">
                    Currently not used
                  </p>
                </div>
                <div className="flex items-center ml-2">
                  <span className="text-xs text-muted-foreground">Not used</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <Button onClick={savePreferences} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-8 px-3">
                Save Preferences
              </Button>
              <Button onClick={acceptAll} variant="outline" size="sm" className="text-xs h-8 px-3">
                Accept All
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 