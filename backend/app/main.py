from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uvicorn
import os
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api.v1 import (
    ip_info, 
    dns_lookup, 
    port_checker, 
    whois_lookup, 
    blacklist_check, 
    speed_test, 
    ping_test, 
    traceroute, 
    email_blacklist, 
    ipv6_test,
    blog,
    admin_auth,
    admin_blog,
    diagnostic
)

# ✅ IMPROVED - Configure logging for better debugging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 🔒 SECURITY FIX - Rate limiting configuration
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="WhatIsMyIP API",
    description="Professional IP address tools and networking utilities API with blog management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# 🔒 SECURITY FIX - Add rate limiting to the app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 🔒 SECURITY FIX - Enhanced CORS configuration
def get_cors_origins():
    """Get CORS origins from environment variables with enhanced security validation."""
    environment = os.getenv("ENVIRONMENT", "development")
    
    # Environment-specific default origins
    default_origins = {
        "development": ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
        "production": []  # No defaults for production - must be explicitly set
    }
    
    # Get origins from environment variable
    origins_env = os.getenv("CORS_ORIGINS")
    
    if not origins_env:
        if environment == "production":
            logger.error("🚨 CRITICAL: CORS_ORIGINS environment variable is required in production!")
            logger.error("🚨 Set CORS_ORIGINS to your allowed domain(s), e.g., 'https://yourdomain.com,https://www.yourdomain.com'")
            raise ValueError("CORS_ORIGINS environment variable is required in production")
        else:
            origins = default_origins[environment]
            logger.info(f"🔒 Using default CORS origins for {environment}: {origins}")
    else:
        # Parse and validate origins
        origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
        
        # Security validation
        for origin in origins:
            if origin == "*":
                if environment == "production":
                    logger.error("🚨 CRITICAL: Wildcard CORS origins (*) are not allowed in production!")
                    raise ValueError("Wildcard CORS origins are not allowed in production")
                else:
                    logger.warning("🚨 SECURITY WARNING: CORS wildcard origins detected! This is insecure for production.")
                    logger.warning("🚨 Consider using specific origins instead of wildcard for better security.")
            elif not (origin.startswith("http://") or origin.startswith("https://")):
                logger.warning(f"🚨 WARNING: Invalid CORS origin format: {origin}")
                logger.warning("🚨 Origins should start with http:// or https://")
    
    logger.info(f"🔒 CORS Origins configured: {origins}")
    return origins

def validate_cors_credentials(origins):
    """Validate CORS credentials configuration."""
    environment = os.getenv("ENVIRONMENT", "development")
    
    # In production, never allow credentials with wildcard origins
    if "*" in origins and environment == "production":
        logger.error("🚨 CRITICAL: Cannot use credentials with wildcard origins in production!")
        raise ValueError("Cannot use credentials with wildcard origins in production")
    
    # Allow credentials only for specific origins (not wildcard)
    allow_credentials = "*" not in origins
    
    if environment == "production" and not allow_credentials:
        logger.warning("🚨 WARNING: CORS credentials disabled. If you need credentials, use specific origins instead of wildcard.")
    
    return allow_credentials

# ✅ IMPROVED - Request timing and error handling middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
    except Exception as e:
        logger.error(f"Request failed: {e}")
        process_time = time.time() - start_time
        logger.error(f"Request to {request.url} failed after {process_time:.2f}s")
        raise

# 🔒 SECURITY FIX - Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=()"
    
    # Add HSTS header for HTTPS requests
    if request.url.scheme == "https" or os.getenv("ENVIRONMENT") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    
    # Remove server information (safely)
    if "Server" in response.headers:
        del response.headers["Server"]
    
    return response

# Get and validate CORS configuration
cors_origins = get_cors_origins()
allow_credentials = validate_cors_credentials(cors_origins)

# ✅ SECURITY FIX - Enhanced CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token"
    ],
    expose_headers=["X-Process-Time", "X-Total-Count"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Include routers
app.include_router(diagnostic.router, prefix="/api/v1", tags=["Diagnostic"])
app.include_router(ip_info.router, prefix="/api/v1", tags=["IP Information"])
app.include_router(dns_lookup.router, prefix="/api/v1", tags=["DNS"])
app.include_router(port_checker.router, prefix="/api/v1", tags=["Port Checker"])
app.include_router(whois_lookup.router, prefix="/api/v1", tags=["Whois"])
app.include_router(blacklist_check.router, prefix="/api/v1", tags=["Security"])
app.include_router(speed_test.router, prefix="/api/v1", tags=["Speed Test"])
app.include_router(ping_test.router, prefix="/api/v1", tags=["Ping Test"])
app.include_router(traceroute.router, prefix="/api/v1", tags=["Traceroute"])
app.include_router(email_blacklist.router, prefix="/api/v1", tags=["Email Security"])
app.include_router(ipv6_test.router, prefix="/api/v1", tags=["IPv6 Testing"])

# ✅ NEW - Blog API routes
app.include_router(blog.router, prefix="/api/v1", tags=["Blog"])

# ✅ NEW - Admin API routes (hidden from public documentation)
app.include_router(admin_auth.router, prefix="/api/v1", tags=["Admin Authentication"], include_in_schema=False)
app.include_router(admin_blog.router, prefix="/api/v1", tags=["Admin Blog Management"], include_in_schema=False)

@app.get("/")
async def root():
    return {
        "message": "WhatIsMyIP API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    # ✅ IMPROVED - Check for development environment
    is_development = os.getenv("ENVIRONMENT", "development") == "development"
    reload_enabled = is_development and os.getenv("DISABLE_RELOAD", "false").lower() != "true"
    
    logger.info(f"Starting server in {'development' if is_development else 'production'} mode")
    logger.info(f"Auto-reload: {'enabled' if reload_enabled else 'disabled'}")
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=reload_enabled,
        access_log=True,
        log_level="info"
    )

