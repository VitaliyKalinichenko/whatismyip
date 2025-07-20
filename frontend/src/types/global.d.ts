// Global type declarations for analytics
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'consent',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
    enableAnalytics: () => void;
    disableAnalytics: () => void;
  }
}

export {}; 