from fastapi import APIRouter, HTTPException, Request
from app.models.ip_models import PingTestRequest, PingTestResult
import asyncio
import logging
import time
import socket
import aiohttp
from typing import List, Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.post("/ping-test", response_model=PingTestResult)
@limiter.limit("10/minute")  # 🔒 SECURITY FIX - Rate limiting for ping test
async def run_ping_test(request: Request, ping_request: PingTestRequest):
    """
    Run a connectivity test using HTTP requests (cloud-friendly alternative to ICMP).
    """
    try:
        # 🔒 SECURITY FIX - Validate input to prevent injection attacks
        if not ping_request.host:
            raise HTTPException(status_code=400, detail="Host is required")
        
        # Validate host for dangerous characters
        dangerous_chars = [';', '&', '|', '`', '$', '(', ')', '<', '>', '"', "'", '\\', '\n', '\r']
        if any(char in ping_request.host for char in dangerous_chars):
            raise HTTPException(status_code=400, detail="Invalid characters in host")
        
        if not 1 <= ping_request.count <= 20:
            raise HTTPException(status_code=400, detail="Count must be between 1 and 20")
        
        logger.info(f"Starting HTTP ping test to {ping_request.host} with {ping_request.count} packets")
        
        # Perform HTTP-based ping test (works better in cloud environments)
        ping_result = await perform_http_ping_test(ping_request.host, ping_request.count)
        
        logger.info(f"HTTP ping test completed for {ping_request.host}: {ping_result.packets_received}/{ping_result.packets_sent} packets received")
        
        return ping_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"HTTP ping test failed for {ping_request.host}: {e}")
        raise HTTPException(status_code=500, detail=f"HTTP ping test failed: {str(e)}")

async def perform_http_ping_test(host: str, count: int, timeout: float = 5.0) -> PingTestResult:
    """
    Perform HTTP-based connectivity test as alternative to ICMP ping.
    This works in cloud environments where ICMP is restricted.
    """
    try:
        # Prepare URLs to test
        test_urls = []
        
        # If host doesn't have protocol, try both HTTPS and HTTP
        if not host.startswith(('http://', 'https://')):
            test_urls = [f"https://{host}", f"http://{host}"]
        else:
            test_urls = [host]
        
        # Resolve IP address for display
        target_ip = host
        try:
            if not host.startswith(('http://', 'https://')):
                target_ip = socket.gethostbyname(host)
                logger.info(f"Resolved {host} to {target_ip}")
        except socket.gaierror:
            logger.warning(f"Could not resolve {host}, using as-is")
            target_ip = host
        
        ping_times = []
        timestamps = []
        packets_sent = count
        packets_received = 0
        working_url = None
        
        # Find a working URL
        connector = aiohttp.TCPConnector(limit=10, limit_per_host=5)
        timeout_config = aiohttp.ClientTimeout(total=timeout, connect=timeout/2)
        
        async with aiohttp.ClientSession(
            connector=connector, 
            timeout=timeout_config,
            headers={'User-Agent': 'WhatIsMyIP-PingTest/1.0'}
        ) as session:
            
            # Test which URL works
            for test_url in test_urls:
                try:
                    logger.debug(f"Testing URL: {test_url}")
                    start_time = time.time()
                    
                    async with session.head(
                        test_url,
                        allow_redirects=True,
                        ssl=False  # Allow self-signed certificates
                    ) as response:
                        response_time = (time.time() - start_time) * 1000
                        
                        # Accept any response (even errors) as "reachable"
                        if response.status < 600:
                            working_url = test_url
                            logger.info(f"Found working URL: {test_url} (status: {response.status}, time: {response_time:.1f}ms)")
                            break
                            
                except Exception as e:
                    logger.debug(f"Failed to connect to {test_url}: {e}")
                    continue
            
            if not working_url:
                logger.error(f"Could not establish connection to any URL for {host}")
                return PingTestResult(
                    host=host,
                    target_ip=target_ip,
                    packets_sent=packets_sent,
                    packets_received=0,
                    packet_loss=100.0,
                    min_time=0,
                    max_time=0,
                    avg_time=0,
                    timestamps=["timeout"] * count,
                    success=False
                )
            
            # Perform the actual "ping" tests
            for i in range(count):
                try:
                    logger.debug(f"HTTP ping {i+1}/{count} to {working_url}")
                    start_time = time.time()
                    
                    async with session.head(
                        working_url,
                        allow_redirects=True,
                        ssl=False
                    ) as response:
                        end_time = time.time()
                        response_time_ms = round((end_time - start_time) * 1000, 1)
                        
                        # Accept any response as successful connectivity
                        ping_times.append(response_time_ms)
                        timestamps.append(f"{response_time_ms}ms")
                        packets_received += 1
                        logger.debug(f"HTTP ping {i+1}: {response_time_ms}ms (HTTP {response.status})")
                        
                except asyncio.TimeoutError:
                    timestamps.append("timeout")
                    logger.debug(f"HTTP ping {i+1}: timeout")
                except aiohttp.ClientError as e:
                    timestamps.append("connection_error")
                    logger.debug(f"HTTP ping {i+1}: connection error - {e}")
                except Exception as e:
                    timestamps.append("error")
                    logger.debug(f"HTTP ping {i+1}: error - {e}")
                
                # Small delay between requests (except for the last one)
                if i < count - 1:
                    await asyncio.sleep(0.5)
        
        # Calculate statistics
        if ping_times:
            min_time = min(ping_times)
            max_time = max(ping_times)
            avg_time = round(sum(ping_times) / len(ping_times), 1)
        else:
            min_time = max_time = avg_time = 0
        
        packet_loss = round(((packets_sent - packets_received) / packets_sent) * 100, 1)
        
        logger.info(f"HTTP ping statistics for {host}: {packets_received}/{packets_sent} received, {packet_loss}% loss, avg={avg_time}ms")
        
        return PingTestResult(
            host=host,
            target_ip=target_ip,
            packets_sent=packets_sent,
            packets_received=packets_received,
            packet_loss=packet_loss,
            min_time=min_time,
            max_time=max_time,
            avg_time=avg_time,
            timestamps=timestamps,
            success=(packets_received > 0)
        )
        
    except Exception as e:
        logger.error(f"HTTP ping test execution failed for {host}: {e}")
        raise Exception(f"HTTP ping test failed: {str(e)}")

@router.get("/ping-test/simple")
async def run_ping_test_simple(host: str, count: int = 4):
    """
    Simple ping test endpoint with query parameters.
    """
    try:
        # Create a mock request object for the limiter
        mock_request = type('MockRequest', (), {'client': type('Client', (), {'host': '127.0.0.1'})()})()
        
        ping_request = PingTestRequest(host=host, count=count)
        return await run_ping_test(mock_request, ping_request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ping test failed: {str(e)}")

@router.get("/ping-test/traceroute")
async def run_traceroute(host: str, max_hops: int = 30):
    """
    Perform a simple HTTP-based traceroute-like test.
    """
    try:
        logger.info(f"Starting HTTP traceroute to {host} with max {max_hops} hops")
        
        # Resolve target
        try:
            target_ip = socket.gethostbyname(host)
        except socket.gaierror:
            raise HTTPException(status_code=400, detail=f"Failed to resolve hostname: {host}")
        
        hops = []
        
        # HTTP-based "traceroute" with different timeouts
        timeout_values = [0.5, 1.0, 2.0, 3.0, 5.0]
        
        for i, timeout in enumerate(timeout_values[:min(max_hops, 5)], 1):
            try:
                # Try HTTP ping with this timeout
                result = await perform_http_ping_test(host, 1, timeout)
                
                if result.success:
                    hops.append({
                        "hop": i,
                        "ip": target_ip,
                        "hostname": host,
                        "response_time": result.avg_time,
                        "status": "success"
                    })
                    # If we get a response, we've reached the target
                    break
                else:
                    hops.append({
                        "hop": i,
                        "ip": "timeout",
                        "hostname": "timeout",
                        "response_time": None,
                        "status": "timeout"
                    })
                    
            except Exception as e:
                hops.append({
                    "hop": i,
                    "ip": "error",
                    "hostname": "error",
                    "response_time": None,
                    "status": "error",
                    "error": str(e)
                })
        
        return {
            "target": host,
            "target_ip": target_ip,
            "hops": hops,
            "completed": any(hop["status"] == "success" for hop in hops)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"HTTP traceroute failed for {host}: {e}")
        raise HTTPException(status_code=500, detail=f"HTTP traceroute failed: {str(e)}")

@router.get("/ping-test/bulk")
async def run_bulk_ping_test(
    hosts: str,
    count: int = 4
):
    """
    Perform ping tests on multiple hosts.
    Limited to 10 hosts per request to prevent abuse.
    """
    try:
        # Parse hosts
        host_list = [h.strip() for h in hosts.split(",") if h.strip()]
        
        if len(host_list) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 hosts per request")
        
        if not 1 <= count <= 10:
            raise HTTPException(status_code=400, detail="Count must be between 1 and 10")
        
        logger.info(f"Starting bulk HTTP ping test for {len(host_list)} hosts")
        
        results = []
        
        # Test each host
        for host in host_list:
            try:
                ping_result = await perform_http_ping_test(host, count)
                results.append({
                    "host": host,
                    "status": "success",
                    "data": ping_result.dict()
                })
            except Exception as e:
                logger.warning(f"HTTP ping test failed for {host}: {e}")
                results.append({
                    "host": host,
                    "status": "error",
                    "error": str(e)
                })
        
        successful_tests = len([r for r in results if r["status"] == "success"])
        logger.info(f"Bulk HTTP ping test completed: {successful_tests}/{len(host_list)} successful")
        
        return {
            "results": results,
            "total_hosts": len(host_list),
            "successful_tests": successful_tests
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk HTTP ping test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Bulk HTTP ping test failed: {str(e)}")

@router.get("/ping-test/connectivity")
async def check_connectivity(host: str):
    """
    Quick connectivity check using HTTP request.
    """
    try:
        logger.info(f"Checking HTTP connectivity to {host}")
        
        # Quick single test
        result = await perform_http_ping_test(host, 1, timeout=3.0)
        
        return {
            "host": host,
            "target_ip": result.target_ip,
            "reachable": result.success,
            "response_time": result.avg_time if result.success else None,
            "status": "online" if result.success else "unreachable"
        }
        
    except Exception as e:
        logger.error(f"Connectivity check failed for {host}: {e}")
        return {
            "host": host,
            "reachable": False,
            "error": str(e),
            "status": "error"
        }
