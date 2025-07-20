// app/instrumentation.client.ts
import posthog from 'posthog-js';

// Initialize PostHog only after consent is given
let posthogInitialized = false;

// Function to initialize PostHog with consent
export function initializePostHog() {
  if (posthogInitialized) return;
  
  const consent = localStorage.getItem('cookie-consent');
  if (consent) {
    const preferences = JSON.parse(consent);
    if (preferences.analytics) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: true,
        debug: false,
        opt_out_capturing_by_default: true, // Don't capture until explicitly enabled
      });
      posthog.opt_in_capturing(); // Enable capturing after consent
      posthogInitialized = true;
    }
  }
}

// Function to disable PostHog
export function disablePostHog() {
  if (posthogInitialized) {
    posthog.opt_out_capturing();
  }
}

// Check for existing consent on load
if (typeof window !== 'undefined') {
  const consent = localStorage.getItem('cookie-consent');
  if (consent) {
    const preferences = JSON.parse(consent);
    if (preferences.analytics) {
      initializePostHog();
    }
  }
} 