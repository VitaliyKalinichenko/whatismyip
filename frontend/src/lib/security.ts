/**
 * Security utilities for the frontend application
 */

// 🔒 SECURITY - CSRF Protection
export class CSRFProtection {
  private static tokenKey = 'csrf_token';
  private static tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours

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

  static clearToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.tokenKey);
    }
  }
}

// 🔒 SECURITY - Content Security Policy
export const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
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
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

// 🔒 SECURITY - XSS Prevention utilities
export class XSSPrevention {
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return '';
      }
      return urlObj.toString();
    } catch {
      return '';
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// 🔒 SECURITY - Rate Limiting
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  private static maxRequests = 100;
  private static windowMs = 60 * 1000;

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

  static clear(): void {
    this.requests.clear();
  }
}

// 🔒 SECURITY - Secure Storage
export class SecureStorage {
  static setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  }

  static getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove data securely:', error);
    }
  }
}

// 🔒 SECURITY - Input Validation
export class InputValidation {
  static sanitizeInput(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const dangerousChars = ['<', '>', '"', "'", '&', ';', '|', '`', '$', '(', ')'];
    let sanitized = input;

    for (const char of dangerousChars) {
      sanitized = sanitized.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    }

    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized.trim();
  }

  static validateDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }

  static validateIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
}

// 🔒 SECURITY - Security Headers
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

// 🔒 SECURITY - Initialize security on frontend
export function initializeSecurity(): void {
  if (typeof window === 'undefined') return;

  CSRFProtection.generateToken();

  window.addEventListener('beforeunload', () => {
    SecureStorage.removeItem('temp_auth_data');
  });

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

  if (typeof window === 'undefined') {
    // On SSR, return plain text (safe fallback)
    return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const dangerousTags = [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea',
    'select', 'button', 'link', 'meta', 'style', 'title', 'base',
    'bgsound', 'xmp', 'plaintext', 'listing', 'comment', 'isindex', 'nextid'
  ];

  dangerousTags.forEach(tag => {
    const elements = tempDiv.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });

  const dangerousAttrs = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
    'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onabort',
    'onbeforeunload', 'onhashchange', 'onmessage', 'onoffline',
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
