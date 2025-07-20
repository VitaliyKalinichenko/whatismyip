// Secure logging utility for production safety
// Only logs in development mode, completely silent in production

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class SecureLogger {
  private isDevelopment: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize: number = 100;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Add security warning in development only
    if (this.isDevelopment) {
      this.showSecurityWarning();
    }
  }

  private showSecurityWarning(): void {
    if (typeof window !== 'undefined' && window.console) {
      const warningStyle = 'color: #ff6b6b; font-size: 16px; font-weight: bold;';
      const messageStyle = 'color: #ffa502; font-size: 14px;';
      
      console.warn(
        '%c⚠️  SECURITY WARNING  ⚠️',
        warningStyle
      );
      console.warn(
        '%cDo not paste unknown code here. It may compromise your account and data.',
        messageStyle
      );
      console.warn(
        '%cIf someone told you to copy/paste something here, they are likely trying to hack you.',
        messageStyle
      );
      console.warn(
        '%cThis is a browser feature intended for developers only.',
        messageStyle
      );
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive information from objects
    const sensitiveKeys = [
      'password', 'token', 'auth', 'secret', 'key', 'authorization',
      'bearer', 'jwt', 'session', 'cookie', 'apikey', 'api_key',
      'access_token', 'refresh_token', 'client_secret'
    ];
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      Object.keys(sanitized).forEach(key => {
        if (sensitiveKeys.some(sensitive => 
          key.toLowerCase().includes(sensitive.toLowerCase())
        )) {
          sanitized[key] = '[REDACTED]';
        }
      });
      
      return sanitized;
    }
    
    return data;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString()
    };
  }

  private addToBuffer(entry: LogEntry): void {
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.logBuffer.shift(); // Remove oldest entry
    }
    this.logBuffer.push(entry);
  }

  private consoleLog(level: LogLevel, message: string, data?: any): void {
    if (!this.isDevelopment) return;
    
    const entry = this.createLogEntry(level, message, data);
    this.addToBuffer(entry);
    
    if (typeof window !== 'undefined' && window.console) {
      const timestamp = new Date().toLocaleTimeString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'error':
          console.error(prefix, message, data ? entry.data : '');
          break;
        case 'warn':
          console.warn(prefix, message, data ? entry.data : '');
          break;
        case 'info':
          console.info(prefix, message, data ? entry.data : '');
          break;
        case 'debug':
          console.debug(prefix, message, data ? entry.data : '');
          break;
        default:
          console.log(prefix, message, data ? entry.data : '');
      }
    }
  }

  // Public logging methods
  log(message: string, data?: any): void {
    this.consoleLog('log', message, data);
  }

  info(message: string, data?: any): void {
    this.consoleLog('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.consoleLog('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.consoleLog('error', message, data);
  }

  debug(message: string, data?: any): void {
    this.consoleLog('debug', message, data);
  }

  // Get log buffer for debugging (development only)
  getLogs(): LogEntry[] {
    return this.isDevelopment ? [...this.logBuffer] : [];
  }

  // Clear log buffer
  clearLogs(): void {
    if (this.isDevelopment) {
      this.logBuffer = [];
    }
  }
}

// Export singleton instance
export const logger = new SecureLogger();

// Export types for TypeScript
export type { LogLevel, LogEntry }; 