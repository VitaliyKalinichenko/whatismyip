from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncio
import subprocess
import re
import logging
import platform
import ipaddress
import shlex
import socket
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from app.models.ip_models import TracerouteResponse, TracerouteHop
from app.utils.security import sanitize_command_input, validate_hostname, validate_ip_address

# 🔒 SECURITY FIX - Add rate limiting
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 🔒 SECURITY FIX - Enhanced target validation
def validate_target(target: str, request: Request) -> str:
    """
    Validate and sanitize target input to prevent command injection.
    Returns the validated target or raises HTTPException.
    """
    if not target or not target.strip():
        raise HTTPException(status_code=400, detail="Target cannot be empty")
    
    target = target.strip()
    
    # Use security utility for validation with request logging
    try:
        # Try to validate as IP address first
        return validate_ip_address(target, request)
    except HTTPException:
        # If not an IP, validate as hostname
        return validate_hostname(target, request)

class TracerouteRequest(BaseModel):
    target: str = Field(..., description="Target hostname or IP address")
    max_hops: int = Field(30, ge=1, le=64, description="Maximum number of hops")
    timeout: int = Field(5, ge=1, le=30, description="Timeout per hop in seconds")

class TracerouteHop(BaseModel):
    hop: int  # Frontend expects 'hop'
    ip: Optional[str] = None  # Frontend expects 'ip'
    hostname: Optional[str] = None
    rtt1: Optional[float] = None
    rtt2: Optional[float] = None
    rtt3: Optional[float] = None
    avg_rtt: Optional[float] = None  # Frontend expects this
    timeout: bool = False
    # Keep original fields for backward compatibility
    hop_number: Optional[int] = None
    ip_address: Optional[str] = None

class TracerouteResponse(BaseModel):
    target: str
    resolved_ip: Optional[str] = None  # Frontend expects 'resolved_ip'
    total_hops: int
    hops: List[TracerouteHop]
    success: bool
    error: Optional[str] = None  # Frontend expects 'error'
    command_used: str
    execution_time: float
    # Keep original fields for backward compatibility
    target_ip: Optional[str] = None
    error_message: Optional[str] = None

def parse_traceroute_output(output: str, is_windows: bool = False) -> List[TracerouteHop]:
    """Parse traceroute output into structured hop data"""
    hops = []
    lines = output.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if is_windows:
            # Windows tracert format: "  1    <1 ms    <1 ms    <1 ms  192.168.1.1"
            # or: "  1     *        *        *     Request timed out."
            match = re.match(r'\s*(\d+)\s+(.+)', line)
            if match:
                hop_num = int(match.group(1))
                rest = match.group(2).strip()
                
                hop = TracerouteHop(hop=hop_num, hop_number=hop_num)
                
                if "Request timed out" in rest or "*" in rest:
                    hop.timeout = True
                else:
                    # Extract RTT values and IP
                    rtt_pattern = r'(\d+|<?\d+)\s*ms'
                    rtts = re.findall(rtt_pattern, rest)
                    
                    # Extract IP address (last part usually)
                    ip_pattern = r'(\d+\.\d+\.\d+\.\d+)'
                    ip_match = re.search(ip_pattern, rest)
                    if ip_match:
                        hop.ip = ip_match.group(1)
                        hop.ip_address = ip_match.group(1)  # backward compatibility
                    
                    # Extract hostname if present
                    hostname_pattern = r'([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
                    hostname_match = re.search(hostname_pattern, rest)
                    if hostname_match and hostname_match.group(1) != hop.ip:
                        hop.hostname = hostname_match.group(1)
                    
                    # Assign RTTs
                    rtts_float = []
                    if len(rtts) >= 1:
                        rtt1 = float(rtts[0].replace('<', ''))
                        hop.rtt1 = rtt1
                        rtts_float.append(rtt1)
                    if len(rtts) >= 2:
                        rtt2 = float(rtts[1].replace('<', ''))
                        hop.rtt2 = rtt2
                        rtts_float.append(rtt2)
                    if len(rtts) >= 3:
                        rtt3 = float(rtts[2].replace('<', ''))
                        hop.rtt3 = rtt3
                        rtts_float.append(rtt3)
                    
                    # Calculate average RTT
                    if rtts_float:
                        hop.avg_rtt = sum(rtts_float) / len(rtts_float)
                
                hops.append(hop)
        else:
            # Unix traceroute format: " 1  gateway (192.168.1.1)  0.123 ms  0.234 ms  0.345 ms"
            # or: " 1  * * *"
            match = re.match(r'\s*(\d+)\s+(.+)', line)
            if match:
                hop_num = int(match.group(1))
                rest = match.group(2).strip()
                
                hop = TracerouteHop(hop=hop_num, hop_number=hop_num)
                
                if rest.count('*') >= 3:
                    hop.timeout = True
                else:
                    # Extract hostname and IP
                    hostname_ip_pattern = r'([a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})?)\s*\(([0-9.]+)\)'
                    hostname_ip_match = re.search(hostname_ip_pattern, rest)
                    
                    if hostname_ip_match:
                        hop.hostname = hostname_ip_match.group(1)
                        hop.ip = hostname_ip_match.group(2)
                        hop.ip_address = hostname_ip_match.group(2)  # backward compatibility
                    else:
                        # Just IP without hostname
                        ip_pattern = r'(\d+\.\d+\.\d+\.\d+)'
                        ip_match = re.search(ip_pattern, rest)
                        if ip_match:
                            hop.ip = ip_match.group(1)
                            hop.ip_address = ip_match.group(1)  # backward compatibility
                    
                    # Extract RTT values
                    rtt_pattern = r'(\d+(?:\.\d+)?)\s*ms'
                    rtts = re.findall(rtt_pattern, rest)
                    
                    rtts_float = []
                    if len(rtts) >= 1:
                        rtt1 = float(rtts[0])
                        hop.rtt1 = rtt1
                        rtts_float.append(rtt1)
                    if len(rtts) >= 2:
                        rtt2 = float(rtts[1])
                        hop.rtt2 = rtt2
                        rtts_float.append(rtt2)
                    if len(rtts) >= 3:
                        rtt3 = float(rtts[2])
                        hop.rtt3 = rtt3
                        rtts_float.append(rtt3)
                    
                    # Calculate average RTT
                    if rtts_float:
                        hop.avg_rtt = sum(rtts_float) / len(rtts_float)
                
                hops.append(hop)
    
    return hops

@router.post("/traceroute", response_model=TracerouteResponse)
@limiter.limit("5/minute")  # 🔒 SECURITY FIX - Rate limiting for resource-intensive operation
async def perform_traceroute(
    request: Request,
    traceroute_request: TracerouteRequest
):
    """
    Perform a traceroute to the specified target
    """
    target = traceroute_request.target
    max_hops = traceroute_request.max_hops
    timeout = traceroute_request.timeout
    logger.info(f"Starting traceroute to {target} with max_hops={max_hops}, timeout={timeout}")
    
    start_time = asyncio.get_event_loop().time()
    
    try:
        # 🔒 SECURITY FIX - Validate target to prevent command injection
        target = validate_target(target, request)
        
        # Determine OS and command
        is_windows = platform.system().lower() == 'windows'
        
        if is_windows:
            # Windows tracert command with sanitized inputs
            cmd = [
                "tracert", 
                "-h", str(max_hops), 
                "-w", str(timeout * 1000), 
                target
            ]
            command_str = f"tracert -h {max_hops} -w {timeout * 1000} {target}"
        else:
            # Unix traceroute command with sanitized inputs
            cmd = [
                "traceroute", 
                "-m", str(max_hops), 
                "-w", str(timeout), 
                target
            ]
            command_str = f"traceroute -m {max_hops} -w {timeout} {target}"
        
        # 🔒 SECURITY FIX - Sanitize command arguments
        from app.utils.security import sanitize_command_args
        cmd = sanitize_command_args(cmd, request)
        
        logger.info(f"Executing command: {command_str}")
        
        # Execute traceroute command with sanitized arguments
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(), 
            timeout=max_hops * timeout + 30  # Give extra time for command completion
        )
        
        execution_time = asyncio.get_event_loop().time() - start_time
        
        output = stdout.decode('utf-8', errors='ignore')
        error_output = stderr.decode('utf-8', errors='ignore')
        
        logger.info(f"Traceroute command completed in {execution_time:.2f}s")
        
        if process.returncode != 0 and not output:
            error_msg = error_output or f"Traceroute command failed with return code {process.returncode}"
            logger.error(f"Traceroute failed: {error_msg}")
            return TracerouteResponse(
                target=target,
                total_hops=0,
                hops=[],
                success=False,
                error=error_msg,
                error_message=error_msg,  # backward compatibility
                command_used=command_str,
                execution_time=execution_time
            )
        
        # Parse the output
        hops = parse_traceroute_output(output, is_windows)
        
        # Extract target IP from output if possible
        target_ip = None
        lines = output.split('\n')
        for line in lines[:5]:  # Check first few lines
            if 'to' in line.lower() or 'tracing' in line.lower():
                ip_match = re.search(r'(\d+\.\d+\.\d+\.\d+)', line)
                if ip_match:
                    target_ip = ip_match.group(1)
                    break
        
        # If we couldn't extract target IP from output, try to resolve it
        if not target_ip:
            try:
                target_ip = str(ipaddress.ip_address(target))
            except ValueError:
                pass  # Not a direct IP, hostname resolution would be needed
        
        logger.info(f"Traceroute completed successfully: {len(hops)} hops found")
        
        return TracerouteResponse(
            target=target,
            resolved_ip=target_ip,
            target_ip=target_ip,  # backward compatibility
            total_hops=len(hops),
            hops=hops,
            success=True,
            command_used=command_str,
            execution_time=execution_time
        )
        
    except asyncio.TimeoutError:
        execution_time = asyncio.get_event_loop().time() - start_time
        error_msg = f"Traceroute timed out after {execution_time:.1f} seconds"
        logger.error(error_msg)
        
        return TracerouteResponse(
            target=target,
            total_hops=0,
            hops=[],
            success=False,
            error=error_msg,
            error_message=error_msg,  # backward compatibility
            command_used=command_str if 'command_str' in locals() else "unknown",
            execution_time=execution_time
        )
        
    except FileNotFoundError:
        execution_time = asyncio.get_event_loop().time() - start_time
        error_msg = "Traceroute command not found on system"
        logger.error(error_msg)
        
        return TracerouteResponse(
            target=target,
            total_hops=0,
            hops=[],
            success=False,
            error=error_msg,
            error_message=error_msg,  # backward compatibility
            command_used="traceroute/tracert",
            execution_time=execution_time
        )
        
    except Exception as e:
        execution_time = asyncio.get_event_loop().time() - start_time
        error_msg = f"Unexpected error during traceroute: {str(e)}"
        logger.error(f"Traceroute error: {error_msg}")
        
        return TracerouteResponse(
            target=target,
            total_hops=0,
            hops=[],
            success=False,
            error=error_msg,
            error_message=error_msg,  # backward compatibility
            command_used="unknown",
            execution_time=execution_time
        )

@router.get("/traceroute", response_model=TracerouteResponse)
async def get_traceroute(
    target: str = Query(..., description="Target hostname or IP address"),
    max_hops: int = Query(30, ge=1, le=64, description="Maximum number of hops"),
    timeout: int = Query(5, ge=1, le=30, description="Timeout per hop in seconds")
):
    """
    Perform a traceroute to the specified target (GET method for convenience)
    """
    request = TracerouteRequest(target=target, max_hops=max_hops, timeout=timeout)
    return await perform_traceroute(request) 