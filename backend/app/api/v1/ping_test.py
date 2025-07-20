from fastapi import APIRouter, HTTPException, Request
from app.models.ip_models import PingTestRequest, PingTestResult
import asyncio
import logging
import time
import ping3
import socket
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
    Run a real ping test to check network connectivity and latency.
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
        
        logger.info(f"Starting ping test to {ping_request.host} with {ping_request.count} packets")
        
        # Perform real ping test
        ping_result = await perform_ping_test(ping_request.host, ping_request.count)
        
        logger.info(f"Ping test completed for {ping_request.host}: {ping_result.packets_received}/{ping_result.packets_sent} packets received")
        
        return ping_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ping test failed for {request.host}: {e}")
        raise HTTPException(status_code=500, detail=f"Ping test failed: {str(e)}")

async def perform_ping_test(host: str, count: int, timeout: float = 3.0) -> PingTestResult:
    """
    Perform real ping test using ping3 library.
    """
    try:
        # Resolve hostname to IP if needed
        try:
            target_ip = socket.gethostbyname(host)
            logger.info(f"Resolved {host} to {target_ip}")
        except socket.gaierror:
            logger.error(f"Failed to resolve hostname: {host}")
            raise Exception(f"Failed to resolve hostname: {host}")
        
        ping_times = []
        timestamps = []
        packets_sent = count
        packets_received = 0
        
        # Perform individual ping tests
        for i in range(count):
            try:
                logger.debug(f"Sending ping {i+1}/{count} to {target_ip}")
                
                # Perform ping
                response_time = ping3.ping(target_ip, timeout=timeout)
                
                if response_time is not None:
                    # Convert to milliseconds and round
                    ping_time_ms = round(response_time * 1000, 1)
                    ping_times.append(ping_time_ms)
                    timestamps.append(f"{ping_time_ms}ms")
                    packets_received += 1
                    logger.debug(f"Ping {i+1}: {ping_time_ms}ms")
                else:
                    timestamps.append("timeout")
                    logger.debug(f"Ping {i+1}: timeout")
                
                # Small delay between pings (except for the last one)
                if i < count - 1:
                    await asyncio.sleep(0.5)
                    
            except Exception as e:
                logger.warning(f"Ping {i+1} failed: {e}")
                timestamps.append("error")
        
        # Calculate statistics
        if ping_times:
            min_time = min(ping_times)
            max_time = max(ping_times)
            avg_time = round(sum(ping_times) / len(ping_times), 1)
        else:
            min_time = max_time = avg_time = 0
        
        packet_loss = round(((packets_sent - packets_received) / packets_sent) * 100, 1)
        
        logger.info(f"Ping statistics for {host}: {packets_received}/{packets_sent} received, {packet_loss}% loss, avg={avg_time}ms")
        
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
        logger.error(f"Ping test execution failed for {host}: {e}")
        raise Exception(f"Ping test failed: {str(e)}")

@router.get("/ping-test/simple")
async def run_ping_test_simple(host: str, count: int = 4):
    """
    Simple ping test endpoint with query parameters.
    """
    try:
        request = PingTestRequest(host=host, count=count)
        return await run_ping_test(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ping test failed: {str(e)}")

@router.get("/ping-test/traceroute")
async def run_traceroute(host: str, max_hops: int = 30):
    """
    Perform a simple traceroute-like test showing network path.
    """
    try:
        logger.info(f"Starting traceroute to {host} with max {max_hops} hops")
        
        # Resolve target
        try:
            target_ip = socket.gethostbyname(host)
        except socket.gaierror:
            raise HTTPException(status_code=400, detail=f"Failed to resolve hostname: {host}")
        
        hops = []
        
        # For simplicity, we'll just do a series of pings with increasing timeouts
        # This is not a real traceroute but gives basic connectivity info
        timeout_values = [0.5, 1.0, 2.0, 3.0, 5.0]
        
        for i, timeout in enumerate(timeout_values[:min(max_hops, 5)], 1):
            try:
                response_time = ping3.ping(target_ip, timeout=timeout)
                
                if response_time is not None:
                    ping_time_ms = round(response_time * 1000, 1)
                    hops.append({
                        "hop": i,
                        "ip": target_ip,
                        "hostname": host,
                        "response_time": ping_time_ms,
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
        logger.error(f"Traceroute failed for {host}: {e}")
        raise HTTPException(status_code=500, detail=f"Traceroute failed: {str(e)}")

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
        
        logger.info(f"Starting bulk ping test for {len(host_list)} hosts")
        
        results = []
        
        # Test each host
        for host in host_list:
            try:
                ping_result = await perform_ping_test(host, count)
                results.append({
                    "host": host,
                    "status": "success",
                    "data": ping_result.dict()
                })
            except Exception as e:
                logger.warning(f"Ping test failed for {host}: {e}")
                results.append({
                    "host": host,
                    "status": "error",
                    "error": str(e)
                })
        
        successful_tests = len([r for r in results if r["status"] == "success"])
        logger.info(f"Bulk ping test completed: {successful_tests}/{len(host_list)} successful")
        
        return {
            "results": results,
            "total_hosts": len(host_list),
            "successful_tests": successful_tests
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk ping test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Bulk ping test failed: {str(e)}")

@router.get("/ping-test/connectivity")
async def check_connectivity(host: str):
    """
    Quick connectivity check using a single ping.
    """
    try:
        logger.info(f"Checking connectivity to {host}")
        
        # Resolve hostname
        try:
            target_ip = socket.gethostbyname(host)
        except socket.gaierror:
            return {
                "host": host,
                "reachable": False,
                "error": "Failed to resolve hostname"
            }
        
        # Single ping test
        try:
            response_time = ping3.ping(target_ip, timeout=3.0)
            
            if response_time is not None:
                ping_time_ms = round(response_time * 1000, 1)
                return {
                    "host": host,
                    "target_ip": target_ip,
                    "reachable": True,
                    "response_time": ping_time_ms,
                    "status": "online"
                }
            else:
                return {
                    "host": host,
                    "target_ip": target_ip,
                    "reachable": False,
                    "status": "timeout"
                }
                
        except Exception as e:
            return {
                "host": host,
                "target_ip": target_ip,
                "reachable": False,
                "error": str(e),
                "status": "error"
            }
        
    except Exception as e:
        logger.error(f"Connectivity check failed for {host}: {e}")
        raise HTTPException(status_code=500, detail=f"Connectivity check failed: {str(e)}") 