"use client";

import { useEffect } from 'react';
import { initializeSecurity } from '@/lib/security';

export function SecurityInitializer() {
  useEffect(() => {
    // Initialize security measures
    initializeSecurity();
    
    // Show security warning on page load
    if (typeof window !== 'undefined') {
      // Additional security initialization can go here
      console.log('%c🔐 Security measures initialized', 'color: green; font-weight: bold;');
    }
  }, []);

  // This component renders nothing, it's just for initialization
  return null;
} 