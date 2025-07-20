from fastapi import APIRouter, HTTPException, Query
from app.models.ip_models import PortCheckRequest, PortCheckResponse, PortStatus, PortCheckResult, PortCheckResultResponse
import asyncio
import socket
import time
import logging
from typing import List

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Common port services mapping
COMMON_PORTS = {
    20: "FTP Data",
    21: "FTP Control",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    993: "IMAPS",
    995: "POP3S",
    3389: "RDP",
    5432: "PostgreSQL",
    3306: "MySQL",
    6379: "Redis",
    27017: "MongoDB",
    8080: "HTTP Proxy",
    8443: "HTTPS Alt",
    9000: "SonarQube",
    5000: "Flask Dev",
    3000: "React Dev",
    4000: "Node Dev",
    8000: "HTTP Alt"
}

async def check_single_port(host: str, port: int, timeout: float = 3.0) -> PortCheckResult:
    """
    Check if a single port is open on the target host using real socket connection.
    """
    start_time = time.time()
    
    try:
        # Create socket connection with timeout
        future = asyncio.open_connection(host, port)
        try:
            reader, writer = await asyncio.wait_for(future, timeout=timeout)
            writer.close()
            await writer.wait_closed()
            
            response_time = round((time.time() - start_time) * 1000, 1)
            service = COMMON_PORTS.get(port)
            
            logger.info(f"Port {port} on {host} is OPEN ({response_time}ms)")
            
            return PortCheckResult(
                host=host,
                port=port,
                is_open=True,
                service=service,
                response_time=response_time
            )
            
        except asyncio.TimeoutError:
            response_time = round((time.time() - start_time) * 1000, 1)
            logger.info(f"Port {port} on {host} is CLOSED/FILTERED (timeout after {response_time}ms)")
            
            return PortCheckResult(
                host=host,
                port=port,
                is_open=False,
                service=COMMON_PORTS.get(port),
                response_time=response_time
            )
            
    except Exception as e:
        response_time = round((time.time() - start_time) * 1000, 1)
        logger.warning(f"Error checking port {port} on {host}: {e}")
        
        return PortCheckResult(
            host=host,
            port=port,
            is_open=False,
            service=COMMON_PORTS.get(port),
            response_time=response_time
        )

@router.post("/port-checker", response_model=PortCheckResultResponse)
async def check_ports(request: PortCheckRequest):
    """
    Check if specified ports are open on a host using real network connections.
    """
    try:
        # Validate input
        if not request.host:
            raise HTTPException(status_code=400, detail="Host is required")
        
        if not request.ports or len(request.ports) > 50:  # Limit to 50 ports for performance
            raise HTTPException(status_code=400, detail="Please specify 1-50 ports to check")
        
        logger.info(f"Checking {len(request.ports)} ports on {request.host}")
        
        # Validate host format (basic check)
        if not is_valid_host(request.host):
            raise HTTPException(status_code=400, detail="Invalid host format")
        
        # Check each port concurrently
        tasks = []
        for port in request.ports:
            if not (1 <= port <= 65535):
                continue
            tasks.append(check_single_port(request.host, port, timeout=5.0))
        
        # Execute all port checks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and invalid results
        valid_results = []
        for result in results:
            if isinstance(result, PortCheckResult):
                valid_results.append(result)
        
        logger.info(f"Port check completed for {request.host}: {len(valid_results)} results")
        
        return PortCheckResultResponse(results=valid_results)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Port check failed for {request.host}: {e}")
        raise HTTPException(status_code=500, detail=f"Port check failed: {str(e)}")

def is_valid_host(host: str) -> bool:
    """
    Basic validation for hostname or IP address.
    """
    if not host or len(host) > 253:
        return False
    
    # Check if it's a valid IP address
    try:
        socket.inet_aton(host)
        return True
    except socket.error:
        pass
    
    # Check if it's a valid hostname
    try:
        socket.gethostbyname(host)
        return True
    except socket.error:
        return False

@router.get("/port-check-simple")
async def check_ports_simple(
    host: str = Query(..., description="Target hostname or IP address"),
    ports: str = Query(..., description="Comma-separated list of ports to check")
):
    """
    Simple port check endpoint that accepts comma-separated ports as a query parameter.
    """
    try:
        # Parse ports
        port_list = []
        for port_str in ports.split(","):
            try:
                port = int(port_str.strip())
                if 1 <= port <= 65535:
                    port_list.append(port)
            except ValueError:
                continue
        
        if not port_list:
            raise HTTPException(status_code=400, detail="No valid ports provided")
        
        # Create request object and use the main port check function
        request = PortCheckRequest(host=host, ports=port_list)
        return await check_ports(request)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Port check failed: {str(e)}")

@router.get("/common-ports")
async def get_common_ports():
    """
    Get a list of commonly used ports and their services.
    """
    return {
        "common_ports": [
            {"port": port, "service": service}
            for port, service in sorted(COMMON_PORTS.items())
        ]
    }

# Security note for production:
"""
IMPORTANT: Port scanning can be considered hostile activity by some networks.
In production, implement the following security measures:

1. Rate limiting per IP address
2. Whitelist of allowed target hosts/networks
3. Logging and monitoring of scan requests
4. User authentication and authorization
5. Terms of service agreement
6. Compliance with local laws and regulations

Example rate limiting implementation:
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/port-check")
@limiter.limit("5/minute")  # 5 requests per minute per IP
async def check_ports(request: Request, port_request: PortCheckRequest):
    # ... implementation
"""

