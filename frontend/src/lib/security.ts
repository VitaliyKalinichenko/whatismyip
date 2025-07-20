/**
 * Security utilities for the frontend application
 */

// 🔒 SECURITY - CSRF Protection
export class CSRFProtection {
  private static tokenKey = 'csrf_token';
  private static tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate a new CSRF token
   */
  static generateToken(): string {
    const token = crypto.getRandomValues(new Uint8Array(32))
      .reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '');
    
    const tokenData = {
      token,
      expires: Date.now() + this.tokenExpiry
    };
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.tokenKey, JSON.stringify(tokenData));
    }
    
    return token;
  }

  /**
   * Get the current CSRF token, generating a new one if needed
   */
  static getToken(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const stored = sessionStorage.getItem(this.tokenKey);
    if (!stored) {
      return this.generateToken();
    }

    try {
      const tokenData = JSON.parse(stored);
      if (Date.now() > tokenData.expires) {
        return this.generateToken();
      }
      return tokenData.token;
    } catch {
      return this.generateToken();
    }
  }

  /**
   * Validate a CSRF token
   */
  static validateToken(token: string): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const stored = sessionStorage.getItem(this.tokenKey);
    if (!stored) {
      return false;
    }

    try {
      const tokenData = JSON.parse(stored);
      if (Date.now() > tokenData.expires) {
        return false;
      }
      return tokenData.token === token;
    } catch {
      return false;
    }
  }

  /**
   * Clear the CSRF token
   */
  static clearToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.tokenKey);
    }
  }
}

// 🔒 SECURITY - Enhanced Content Security Policy
export const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'",   // Required for Next.js development
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:'
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:'
  ],
  'connect-src': [
    "'self'",
    'https://api.whatismyip.com',
    'https://www.google-analytics.com',
    'https://api.ipify.org',
    'https://ip-api.com'
  ],
  'frame-src': [
    "'none'"
  ],
  'object-src': [
    "'none'"
  ],
  'base-uri': [
    "'self'"
  ],
  'form-action': [
    "'self'"
  ],
  'frame-ancestors': [
    "'none'"
  ],
  'upgrade-insecure-requests': []
};

// 🔒 SECURITY - XSS Prevention utilities
export class XSSPrevention {
  /**
   * Escape HTML to prevent XSS
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Validate and sanitize URLs
   */
  static sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return '';
      }
      return urlObj.toString();
    } catch {
      return '';
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// 🔒 SECURITY - Rate limiting utilities
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  private static maxRequests = 100;
  private static windowMs = 60 * 1000; // 1 minute

  /**
   * Check if a request is allowed
   */
  static isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requestData = this.requests.get(identifier);

    if (!requestData || now > requestData.resetTime) {
      this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (requestData.count >= this.maxRequests) {
      return false;
    }

    requestData.count++;
    return true;
  }

  /**
   * Clear rate limiting data
   */
  static clear(): void {
    this.requests.clear();
  }
}

// 🔒 SECURITY - Secure storage utilities
export class SecureStorage {
  /**
   * Store data securely (encrypted in production)
   */
  static setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      // In production, this should be encrypted
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  }

  /**
   * Retrieve data securely
   */
  static getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  }

  /**
   * Remove data securely
   */
  static removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove data securely:', error);
    }
  }
}

// 🔒 SECURITY - Input validation utilities
export class InputValidation {
  /**
   * Validate and sanitize user input
   */
  static sanitizeInput(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove dangerous characters
    const dangerousChars = ['<', '>', '"', "'", '&', ';', '|', '`', '$', '(', ')'];
    let sanitized = input;
    
    for (const char of dangerousChars) {
      sanitized = sanitized.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    }

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized.trim();
  }

  /**
   * Validate domain name
   */
  static validateDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }

  /**
   * Validate IP address
   */
  static validateIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
}

// 🔒 SECURITY - Security headers configuration
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': Object.entries(CSP_POLICY)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
};

// 🔒 SECURITY - Initialize security features
export function initializeSecurity(): void {
  if (typeof window === 'undefined') return;

  // Generate CSRF token on app start
  CSRFProtection.generateToken();

  // Add security event listeners
  window.addEventListener('beforeunload', () => {
    // Clear sensitive data on page unload
    SecureStorage.removeItem('temp_auth_data');
  });

  // Monitor for potential XSS attempts
  const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (originalInnerHTML) {
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: function(value) {
        if (typeof value === 'string' && value.includes('<script')) {
          console.warn('Potential XSS attempt detected');
          return;
        }
        originalInnerHTML.set?.call(this, value);
      },
      get: function() {
        return originalInnerHTML.get?.call(this);
      }
    });
  }
} 

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML content
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Create a temporary div to parse and sanitize HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Remove dangerous tags
  const dangerousTags = [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea',
    'select', 'button', 'link', 'meta', 'style', 'title', 'base',
    'bgsound', 'xmp', 'plaintext', 'listing', 'comment', 'isindex', 'nextid'
  ];

  dangerousTags.forEach(tag => {
    const elements = tempDiv.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });

  // Remove dangerous attributes
  const dangerousAttrs = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
    'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onabort',
    'onbeforeunload', 'onerror', 'onhashchange', 'onmessage', 'onoffline',
    'ononline', 'onpagehide', 'onpageshow', 'onpopstate', 'onresize',
    'onstorage', 'oncontextmenu', 'onkeydown', 'onkeypress', 'onkeyup',
    'onmousedown', 'onmousemove', 'onmouseout', 'onmouseup', 'onwheel'
  ];

  const allElements = tempDiv.querySelectorAll('*');
  allElements.forEach(el => {
    dangerousAttrs.forEach(attr => {
      if (el.hasAttribute(attr)) {
        el.removeAttribute(attr);
      }
    });

    // Remove javascript: and data: URLs
    const href = el.getAttribute('href');
    if (href && (href.toLowerCase().startsWith('javascript:') || href.toLowerCase().startsWith('data:'))) {
      el.removeAttribute('href');
    }

    const src = el.getAttribute('src');
    if (src && (src.toLowerCase().startsWith('javascript:') || src.toLowerCase().startsWith('data:'))) {
      el.removeAttribute('src');
    }
  });

  return tempDiv.innerHTML;
} 