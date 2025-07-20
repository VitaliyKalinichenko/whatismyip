from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import socket
import ipaddress
import dns.resolver
import logging
import time
import httpx

logger = logging.getLogger(__name__)

router = APIRouter()

class IPv6TestResult(BaseModel):
    test_name: str
    success: bool
    result: Optional[str] = None
    error: Optional[str] = None
    duration_ms: float

class IPv6ConnectivityTest(BaseModel):
    has_ipv6_support: bool
    local_ipv6_addresses: List[str] = []
    can_resolve_ipv6_dns: bool
    ipv6_dns_servers: List[str] = []
    can_connect_ipv6_websites: bool
    test_results: List[IPv6TestResult] = []
    overall_score: int  # 0-100
    status: str  # "excellent", "good", "partial", "none"
    recommendations: List[str] = []

class IPv6TestResponse(BaseModel):
    client_ip: Optional[str] = None
    client_has_ipv6: bool = False
    connectivity_test: IPv6ConnectivityTest
    execution_time: float
    success: bool
    error_message: Optional[str] = None

# Test targets for IPv6 connectivity
IPV6_TEST_TARGETS = [
    ("Google DNS", "2001:4860:4860::8888", 53),
    ("Cloudflare DNS", "2606:4700:4700::1111", 53),
    ("Google.com", "google.com", 80),
    ("Facebook.com", "facebook.com", 80),
    ("GitHub.com", "github.com", 80)
]

# IPv6 DNS servers to test
IPV6_DNS_SERVERS = [
    "2001:4860:4860::8888",  # Google
    "2606:4700:4700::1111",  # Cloudflare
    "2001:4860:4860::8844",  # Google Secondary
    "2606:4700:4700::1001"   # Cloudflare Secondary
]

def get_local_ipv6_addresses() -> List[str]:
    """Get local IPv6 addresses"""
    ipv6_addresses = []
    
    try:
        # Get all network interfaces
        import socket
        hostname = socket.gethostname()
        
        # Get all addresses for this host
        addr_info = socket.getaddrinfo(hostname, None)
        
        for info in addr_info:
            if info[0] == socket.AF_INET6:  # IPv6
                addr = info[4][0]
                # Filter out loopback and link-local addresses for the main list
                if not addr.startswith('::1') and not addr.startswith('fe80'):
                    ipv6_addresses.append(addr)
                    
    except Exception as e:
        logger.warning(f"Could not get local IPv6 addresses: {str(e)}")
    
    return list(set(ipv6_addresses))  # Remove duplicates

async def test_ipv6_socket_support() -> IPv6TestResult:
    """Test if IPv6 socket support is available"""
    start_time = time.time()
    
    try:
        # Try to create an IPv6 socket
        sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        sock.close()
        
        duration = (time.time() - start_time) * 1000
        return IPv6TestResult(
            test_name="IPv6 Socket Support",
            success=True,
            result="IPv6 sockets are supported",
            duration_ms=duration
        )
        
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        return IPv6TestResult(
            test_name="IPv6 Socket Support",
            success=False,
            error=f"IPv6 socket creation failed: {str(e)}",
            duration_ms=duration
        )

async def test_ipv6_dns_resolution() -> IPv6TestResult:
    """Test IPv6 DNS resolution"""
    start_time = time.time()
    
    try:
        # Try to resolve a known IPv6 address
        resolver = dns.resolver.Resolver()
        resolver.timeout = 5
        resolver.lifetime = 5
        
        # Test resolving AAAA records
        answers = resolver.resolve('google.com', 'AAAA')
        ipv6_addresses = [str(answer) for answer in answers]
        
        duration = (time.time() - start_time) * 1000
        return IPv6TestResult(
            test_name="IPv6 DNS Resolution",
            success=True,
            result=f"Resolved {len(ipv6_addresses)} IPv6 addresses: {', '.join(ipv6_addresses[:3])}",
            duration_ms=duration
        )
        
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        return IPv6TestResult(
            test_name="IPv6 DNS Resolution",
            success=False,
            error=f"IPv6 DNS resolution failed: {str(e)}",
            duration_ms=duration
        )

async def test_ipv6_connectivity(target_name: str, target_host: str, port: int) -> IPv6TestResult:
    """Test IPv6 connectivity to a specific target"""
    start_time = time.time()
    
    try:
        # If target_host is a hostname, resolve it first
        if not target_host.replace(':', '').replace('.', '').isalnum():
            # It's likely an IPv6 address already
            target_ip = target_host
        else:
            # Resolve hostname to IPv6
            try:
                resolver = dns.resolver.Resolver()
                resolver.timeout = 3
                answers = resolver.resolve(target_host, 'AAAA')
                target_ip = str(answers[0])
            except:
                duration = (time.time() - start_time) * 1000
                return IPv6TestResult(
                    test_name=f"IPv6 Connectivity - {target_name}",
                    success=False,
                    error=f"Could not resolve {target_host} to IPv6",
                    duration_ms=duration
                )
        
        # Test connection
        future = asyncio.open_connection(target_ip, port, family=socket.AF_INET6)
        reader, writer = await asyncio.wait_for(future, timeout=10)
        
        writer.close()
        await writer.wait_closed()
        
        duration = (time.time() - start_time) * 1000
        return IPv6TestResult(
            test_name=f"IPv6 Connectivity - {target_name}",
            success=True,
            result=f"Successfully connected to {target_ip}:{port}",
            duration_ms=duration
        )
        
    except asyncio.TimeoutError:
        duration = (time.time() - start_time) * 1000
        return IPv6TestResult(
            test_name=f"IPv6 Connectivity - {target_name}",
            success=False,
            error=f"Connection timeout to {target_name}",
            duration_ms=duration
        )
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        return IPv6TestResult(
            test_name=f"IPv6 Connectivity - {target_name}",
            success=False,
            error=f"Connection failed: {str(e)}",
            duration_ms=duration
        )

async def test_ipv6_dns_servers() -> IPv6TestResult:
    """Test connectivity to IPv6 DNS servers"""
    start_time = time.time()
    working_servers = []
    
    for dns_server in IPV6_DNS_SERVERS:
        try:
            future = asyncio.open_connection(dns_server, 53, family=socket.AF_INET6)
            reader, writer = await asyncio.wait_for(future, timeout=5)
            writer.close()
            await writer.wait_closed()
            working_servers.append(dns_server)
        except:
            continue
    
    duration = (time.time() - start_time) * 1000
    
    if working_servers:
        return IPv6TestResult(
            test_name="IPv6 DNS Server Connectivity",
            success=True,
            result=f"Connected to {len(working_servers)} IPv6 DNS servers: {', '.join(working_servers)}",
            duration_ms=duration
        )
    else:
        return IPv6TestResult(
            test_name="IPv6 DNS Server Connectivity",
            success=False,
            error="Could not connect to any IPv6 DNS servers",
            duration_ms=duration
        )

def calculate_ipv6_score(test_results: List[IPv6TestResult], has_local_ipv6: bool) -> int:
    """Calculate overall IPv6 connectivity score (0-100)"""
    score = 0
    
    # Local IPv6 addresses (20 points)
    if has_local_ipv6:
        score += 20
    
    # Test results (80 points total)
    if test_results:
        passed_tests = sum(1 for result in test_results if result.success)
        total_tests = len(test_results)
        score += int((passed_tests / total_tests) * 80)
    
    return min(100, score)

def determine_ipv6_status(score: int) -> str:
    """Determine IPv6 status based on score"""
    if score >= 80:
        return "excellent"
    elif score >= 60:
        return "good"
    elif score >= 20:
        return "partial"
    else:
        return "none"

def generate_recommendations(connectivity_test: IPv6ConnectivityTest) -> List[str]:
    """Generate recommendations based on test results"""
    recommendations = []
    
    if not connectivity_test.has_ipv6_support:
        recommendations.append("Your system does not support IPv6. Check your network configuration.")
    
    if not connectivity_test.local_ipv6_addresses:
        recommendations.append("No local IPv6 addresses found. Your ISP may not provide IPv6 connectivity.")
    
    if not connectivity_test.can_resolve_ipv6_dns:
        recommendations.append("IPv6 DNS resolution is not working. Check your DNS server configuration.")
    
    if not connectivity_test.can_connect_ipv6_websites:
        recommendations.append("Cannot connect to IPv6 websites. Your network may not have full IPv6 connectivity.")
    
    if connectivity_test.overall_score < 50:
        recommendations.append("Consider contacting your ISP about IPv6 support.")
        recommendations.append("Check if IPv6 is enabled in your router/firewall settings.")
    
    if not recommendations:
        recommendations.append("Your IPv6 connectivity looks good!")
    
    return recommendations

@router.get("/ipv6-test", response_model=IPv6TestResponse)
async def perform_ipv6_test():
    """
    Perform comprehensive IPv6 connectivity testing
    """
    logger.info("Starting IPv6 connectivity test")
    
    start_time = time.time()
    
    try:
        # Get local IPv6 addresses
        local_ipv6_addresses = get_local_ipv6_addresses()
        has_local_ipv6 = len(local_ipv6_addresses) > 0
        
        logger.info(f"Found {len(local_ipv6_addresses)} local IPv6 addresses")
        
        # Run all tests
        test_results = []
        
        # Test IPv6 socket support
        socket_test = await test_ipv6_socket_support()
        test_results.append(socket_test)
        
        # Test IPv6 DNS resolution
        dns_test = await test_ipv6_dns_resolution()
        test_results.append(dns_test)
        
        # Test IPv6 DNS servers
        dns_server_test = await test_ipv6_dns_servers()
        test_results.append(dns_server_test)
        
        # Test connectivity to various IPv6 websites
        connectivity_tasks = [
            test_ipv6_connectivity(name, host, port) 
            for name, host, port in IPV6_TEST_TARGETS
        ]
        connectivity_results = await asyncio.gather(*connectivity_tasks, return_exceptions=True)
        
        # Add successful connectivity tests
        for result in connectivity_results:
            if isinstance(result, IPv6TestResult):
                test_results.append(result)
            elif isinstance(result, Exception):
                logger.warning(f"Connectivity test failed: {str(result)}")
        
        # Analyze results
        has_ipv6_support = socket_test.success
        can_resolve_ipv6_dns = dns_test.success
        can_connect_websites = any(
            result.success for result in connectivity_results 
            if isinstance(result, IPv6TestResult) and "Connectivity" in result.test_name
        )
        
        # Get working IPv6 DNS servers
        ipv6_dns_servers = []
        if dns_server_test.success and dns_server_test.result:
            # Extract DNS servers from result
            import re
            servers = re.findall(r'2[0-9a-f]{3}:[0-9a-f:]+', dns_server_test.result)
            ipv6_dns_servers = servers
        
        # Calculate score
        score = calculate_ipv6_score(test_results, has_local_ipv6)
        status = determine_ipv6_status(score)
        
        # Create connectivity test result
        connectivity_test = IPv6ConnectivityTest(
            has_ipv6_support=has_ipv6_support,
            local_ipv6_addresses=local_ipv6_addresses,
            can_resolve_ipv6_dns=can_resolve_ipv6_dns,
            ipv6_dns_servers=ipv6_dns_servers,
            can_connect_ipv6_websites=can_connect_websites,
            test_results=test_results,
            overall_score=score,
            status=status,
            recommendations=[]
        )
        
        # Generate recommendations
        connectivity_test.recommendations = generate_recommendations(connectivity_test)
        
        execution_time = time.time() - start_time
        
        logger.info(f"IPv6 test completed: score={score}, status={status}")
        
        return IPv6TestResponse(
            client_ip=None,  # This would be filled by the frontend or proxy
            client_has_ipv6=has_local_ipv6,
            connectivity_test=connectivity_test,
            execution_time=execution_time,
            success=True
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        error_msg = f"Error during IPv6 test: {str(e)}"
        logger.error(error_msg)
        
        return IPv6TestResponse(
            client_ip=None,
            client_has_ipv6=False,
            connectivity_test=IPv6ConnectivityTest(
                has_ipv6_support=False,
                local_ipv6_addresses=[],
                can_resolve_ipv6_dns=False,
                ipv6_dns_servers=[],
                can_connect_ipv6_websites=False,
                test_results=[],
                overall_score=0,
                status="none",
                recommendations=["Test failed due to an error. Please try again."]
            ),
            execution_time=execution_time,
            success=False,
            error_message=error_msg
        )

@router.post("/ipv6-test", response_model=IPv6TestResponse)
async def post_ipv6_test():
    """
    Perform comprehensive IPv6 connectivity testing (POST method)
    """
    return await perform_ipv6_test() 