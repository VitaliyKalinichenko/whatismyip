from fastapi import APIRouter, Request
import time
import json
from datetime import datetime

router = APIRouter()

@router.get("/diagnostic")
async def diagnostic_test(request: Request):
    """
    Diagnostic endpoint to test API performance and connectivity.
    """
    start_time = time.time()
    
    try:
        # Get client IP
        client_ip = request.client.host
        forwarded_for = request.headers.get("X-Forwarded-For")
        real_ip = request.headers.get("X-Real-IP")
        
        # Determine effective IP
        effective_ip = client_ip
        if forwarded_for:
            effective_ip = forwarded_for.split(',')[0].strip()
        elif real_ip:
            effective_ip = real_ip
        
        # Response time calculation
        response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "response_time_ms": round(response_time, 2),
            "client_info": {
                "ip": effective_ip,
                "original_ip": client_ip,
                "forwarded_for": forwarded_for,
                "real_ip": real_ip,
                "headers": {
                    "user_agent": request.headers.get("User-Agent"),
                    "accept": request.headers.get("Accept"),
                    "host": request.headers.get("Host")
                }
            },
            "server_info": {
                "api_version": "1.0",
                "environment": "development" if effective_ip.startswith("127.") else "production"
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "response_time_ms": round((time.time() - start_time) * 1000, 2)
        }

@router.get("/health")
async def health_check():
    """
    Simple health check endpoint.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "running",
            "database": "not_configured",
            "cache": "memory"
        }
    } 