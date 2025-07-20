"""
Security utilities for input validation and sanitization.
"""

import re
import ipaddress
import logging
import json
import time
from typing import List, Optional, Union, Dict, Any
from fastapi import HTTPException, status, Request
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# 🔒 SECURITY - Security monitoring and logging
class SecurityMonitor:
    """Monitor and log security events."""
    
    def __init__(self):
        self.suspicious_ips = {}
        self.failed_attempts = {}
        self.blocked_requests = {}
        self.security_events = []
    
    def log_security_event(self, event_type: str, details: Dict[str, Any], request: Optional[Request] = None):
        """Log a security event with details."""
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type,
            'details': details,
            'ip_address': request.client.host if request else 'unknown',
            'user_agent': request.headers.get('user-agent', 'unknown') if request else 'unknown',
            'path': request.url.path if request else 'unknown'
        }
        
        self.security_events.append(event)
        logger.warning(f"SECURITY EVENT: {event_type} - {json.dumps(details)}")
        
        # Keep only last 1000 events
        if len(self.security_events) > 1000:
            self.security_events = self.security_events[-1000:]
    
    def check_suspicious_activity(self, ip: str, request_type: str) -> bool:
        """Check if IP is showing suspicious activity."""
        now = time.time()
        
        if ip not in self.suspicious_ips:
            self.suspicious_ips[ip] = {'count': 0, 'last_seen': now, 'blocked_until': 0}
        
        ip_data = self.suspicious_ips[ip]
        
        # Check if IP is currently blocked
        if now < ip_data['blocked_until']:
            return True
        
        # Reset counter if more than 1 hour has passed
        if now - ip_data['last_seen'] > 3600:
            ip_data['count'] = 0
        
        ip_data['count'] += 1
        ip_data['last_seen'] = now
        
        # Block IP if too many suspicious activities
        if ip_data['count'] > 50:
            ip_data['blocked_until'] = now + 3600  # Block for 1 hour
            self.log_security_event('IP_BLOCKED', {
                'ip': ip,
                'reason': 'Too many suspicious activities',
                'block_duration': 3600
            })
            return True
        
        return False
    
    def record_failed_attempt(self, ip: str, endpoint: str, reason: str):
        """Record a failed authentication attempt."""
        now = time.time()
        key = f"{ip}:{endpoint}"
        
        if key not in self.failed_attempts:
            self.failed_attempts[key] = {'count': 0, 'last_attempt': now}
        
        attempt_data = self.failed_attempts[key]
        
        # Reset counter if more than 15 minutes have passed
        if now - attempt_data['last_attempt'] > 900:
            attempt_data['count'] = 0
        
        attempt_data['count'] += 1
        attempt_data['last_attempt'] = now
        
        # Log suspicious activity
        if attempt_data['count'] > 5:
            self.log_security_event('FAILED_AUTH_ATTEMPT', {
                'ip': ip,
                'endpoint': endpoint,
                'reason': reason,
                'attempt_count': attempt_data['count']
            })
    
    def get_security_report(self) -> Dict[str, Any]:
        """Get a security report."""
        return {
            'total_events': len(self.security_events),
            'blocked_ips': len([ip for ip, data in self.suspicious_ips.items() if time.time() < data['blocked_until']]),
            'recent_events': self.security_events[-10:],
            'suspicious_ips': {ip: data for ip, data in self.suspicious_ips.items() if data['count'] > 10}
        }

# Global security monitor instance
security_monitor = SecurityMonitor()

# 🔒 SECURITY - Input validation patterns
DANGEROUS_CHARS = [';', '&', '|', '`', '$', '(', ')', '<', '>', '"', "'", '\\', '\n', '\r', '\t']
DANGEROUS_PATTERNS = [
    r'\.\./',  # Directory traversal
    r'\.\.\\',  # Windows directory traversal
    r'%2e%2e',  # URL encoded directory traversal
    r'%2e%2e%2f',  # URL encoded directory traversal
    r'javascript:',  # XSS
    r'data:',  # Data URLs
    r'vbscript:',  # VBScript
    r'on\w+\s*=',  # Event handlers
    r'<script',  # Script tags
    r'<iframe',  # Iframe tags
    r'<object',  # Object tags
    r'<embed',  # Embed tags
    r'<form',  # Form tags
    r'<input',  # Input tags
    r'<textarea',  # Textarea tags
    r'<select',  # Select tags
    r'<button',  # Button tags
    r'<link',  # Link tags
    r'<meta',  # Meta tags
    r'<style',  # Style tags
    r'<title',  # Title tags
    r'<base',  # Base tags
    r'<bgsound',  # BGSound tags
    r'<xmp',  # XMP tags
    r'<plaintext',  # Plaintext tags
    r'<listing',  # Listing tags
    r'<comment',  # Comment tags
    r'<isindex',  # Isindex tags
    r'<nextid',  # Nextid tags
    r'<xmp',  # XMP tags
    r'<plaintext',  # Plaintext tags
    r'<listing',  # Listing tags
    r'<comment',  # Comment tags
    r'<isindex',  # Isindex tags
    r'<nextid',  # Nextid tags
]

def sanitize_command_input(input_str: str, max_length: int = 100, request: Optional[Request] = None) -> str:
    """
    Sanitize input for command execution.
    
    Args:
        input_str: Input string to sanitize
        max_length: Maximum allowed length
        request: FastAPI request object for logging
        
    Returns:
        Sanitized string
        
    Raises:
        HTTPException: If input is invalid
    """
    if not input_str or not isinstance(input_str, str):
        security_monitor.log_security_event('INVALID_INPUT', {
            'type': 'empty_or_invalid_type',
            'input': str(input_str)[:100]
        }, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid input: must be a non-empty string"
        )
    
    # Check length
    if len(input_str) > max_length:
        security_monitor.log_security_event('INPUT_TOO_LONG', {
            'input_length': len(input_str),
            'max_length': max_length,
            'input_preview': input_str[:100]
        }, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Input too long: maximum {max_length} characters allowed"
        )
    
    # Remove dangerous characters
    sanitized = input_str
    for char in DANGEROUS_CHARS:
        sanitized = sanitized.replace(char, '')
    
    # Check for dangerous patterns
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, sanitized, re.IGNORECASE):
            security_monitor.log_security_event('DANGEROUS_PATTERN_DETECTED', {
                'pattern': pattern,
                'input': input_str[:100],
                'sanitized': sanitized[:100]
            }, request)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid input: contains potentially dangerous content"
            )
    
    # Trim whitespace
    sanitized = sanitized.strip()
    
    if not sanitized:
        security_monitor.log_security_event('EMPTY_AFTER_SANITIZATION', {
            'original_input': input_str[:100]
        }, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid input: empty after sanitization"
        )
    
    return sanitized

def validate_hostname(hostname: str, request: Optional[Request] = None) -> str:
    """
    Validate and sanitize hostname input.
    
    Args:
        hostname: Hostname to validate
        request: FastAPI request object for logging
        
    Returns:
        Validated hostname
        
    Raises:
        HTTPException: If hostname is invalid
    """
    if not hostname or len(hostname) > 253:
        security_monitor.log_security_event('INVALID_HOSTNAME', {
            'hostname': hostname[:100],
            'length': len(hostname) if hostname else 0
        }, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid hostname: too long or empty"
        )
    
    # Block private ranges and localhost
    blocked_patterns = [
        r'localhost',
        r'127\.0\.0\.1',
        r'10\.',
        r'172\.(1[6-9]|2[0-9]|3[0-1])\.',
        r'192\.168\.',
        r'169\.254\.',
        r'::1',
        r'fd[0-9a-f]{2}:',
        r'fe80:',
        r'fc00:',
        r'fd00:'
    ]
    
    for pattern in blocked_patterns:
        if re.search(pattern, hostname, re.IGNORECASE):
            security_monitor.log_security_event('PRIVATE_HOSTNAME_ATTEMPT', {
                'hostname': hostname,
                'blocked_pattern': pattern
            }, request)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid hostname: private/local addresses not allowed"
            )
    
    # Enhanced domain validation
    domain_pattern = r'^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
    if not re.match(domain_pattern, hostname):
        security_monitor.log_security_event('INVALID_HOSTNAME_FORMAT', {
            'hostname': hostname
        }, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid hostname format"
        )
    
    return hostname

def validate_ip_address(ip: str, request: Optional[Request] = None) -> str:
    """
    Validate IP address and block private ranges.
    
    Args:
        ip: IP address to validate
        request: FastAPI request object for logging
        
    Returns:
        Validated IP address
        
    Raises:
        HTTPException: If IP is invalid
    """
    try:
        ip_obj = ipaddress.ip_address(ip)
        
        # Block private and reserved ranges
        if (ip_obj.is_private or 
            ip_obj.is_loopback or 
            ip_obj.is_link_local or 
            ip_obj.is_multicast or
            ip_obj.is_reserved):
            security_monitor.log_security_event('PRIVATE_IP_ATTEMPT', {
                'ip': str(ip_obj),
                'is_private': ip_obj.is_private,
                'is_loopback': ip_obj.is_loopback,
                'is_link_local': ip_obj.is_link_local,
                'is_multicast': ip_obj.is_multicast,
                'is_reserved': ip_obj.is_reserved
            }, request)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid IP address: private/reserved addresses not allowed"
            )
        
        return str(ip_obj)
        
    except ValueError:
        security_monitor.log_security_event('INVALID_IP_FORMAT', {
            'ip': ip
        }, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid IP address format"
        )

def sanitize_command_args(args: List[str], request: Optional[Request] = None) -> List[str]:
    """
    Sanitize command arguments for subprocess execution.
    
    Args:
        args: List of command arguments
        request: FastAPI request object for logging
        
    Returns:
        Sanitized command arguments
        
    Raises:
        HTTPException: If any argument is invalid
    """
    if not args:
        security_monitor.log_security_event('EMPTY_COMMAND_ARGS', {}, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid command: no arguments provided"
        )
    
    sanitized_args = []
    for i, arg in enumerate(args):
        if not isinstance(arg, str):
            security_monitor.log_security_event('INVALID_COMMAND_ARG_TYPE', {
                'arg_index': i,
                'arg_type': type(arg).__name__,
                'arg_value': str(arg)[:100]
            }, request)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid command argument: must be string"
            )
        
        # Sanitize each argument
        try:
            sanitized_arg = sanitize_command_input(arg, max_length=200, request=request)
            sanitized_args.append(sanitized_arg)
        except HTTPException as e:
            security_monitor.log_security_event('COMMAND_ARG_SANITIZATION_FAILED', {
                'arg_index': i,
                'arg_value': arg[:100],
                'error': str(e.detail)
            }, request)
            raise
    
    return sanitized_args

def validate_port_number(port: Union[int, str], request: Optional[Request] = None) -> int:
    """
    Validate port number.
    
    Args:
        port: Port number to validate
        request: FastAPI request object for logging
        
    Returns:
        Validated port number
        
    Raises:
        HTTPException: If port is invalid
    """
    try:
        port_int = int(port)
        if not (1 <= port_int <= 65535):
            security_monitor.log_security_event('INVALID_PORT_RANGE', {
                'port': port_int
            }, request)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid port number: must be between 1 and 65535"
            )
        return port_int
    except (ValueError, TypeError):
        security_monitor.log_security_event('INVALID_PORT_FORMAT', {
            'port': str(port)
        }, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid port number: must be a valid integer"
        )

def sanitize_html_content(content: str, max_length: int = 10000, request: Optional[Request] = None) -> str:
    """
    Sanitize HTML content to prevent XSS.
    
    Args:
        content: HTML content to sanitize
        max_length: Maximum allowed length
        request: FastAPI request object for logging
        
    Returns:
        Sanitized HTML content
        
    Raises:
        HTTPException: If content is invalid
    """
    if not content or not isinstance(content, str):
        security_monitor.log_security_event('INVALID_HTML_CONTENT', {
            'content_type': type(content).__name__,
            'content_preview': str(content)[:100]
        }, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content: must be a non-empty string"
        )
    
    if len(content) > max_length:
        security_monitor.log_security_event('HTML_CONTENT_TOO_LONG', {
            'content_length': len(content),
            'max_length': max_length
        }, request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content too long: maximum {max_length} characters allowed"
        )
    
    # Remove dangerous HTML tags and attributes
    dangerous_tags = [
        'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 
        'select', 'button', 'link', 'meta', 'style', 'title', 'base', 
        'bgsound', 'xmp', 'plaintext', 'listing', 'comment', 'isindex', 'nextid'
    ]
    
    dangerous_attrs = [
        'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
        'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onabort',
        'onbeforeunload', 'onerror', 'onhashchange', 'onmessage', 'onoffline',
        'ononline', 'onpagehide', 'onpageshow', 'onpopstate', 'onresize',
        'onstorage', 'oncontextmenu', 'onkeydown', 'onkeypress', 'onkeyup',
        'onmousedown', 'onmousemove', 'onmouseout', 'onmouseup', 'onwheel'
    ]
    
    # Simple HTML sanitization (for production, use a proper HTML sanitizer)
    sanitized = content
    
    # Remove dangerous tags
    for tag in dangerous_tags:
        pattern = rf'<{tag}[^>]*>.*?</{tag}>|<{tag}[^>]*/?>'
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove dangerous attributes
    for attr in dangerous_attrs:
        pattern = rf'\s+{attr}\s*=\s*["\'][^"\']*["\']'
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
    
    # Remove any remaining script-like content
    script_patterns = [
        r'javascript:',
        r'vbscript:',
        r'data:',
        r'<script',
        r'</script>'
    ]
    
    for pattern in script_patterns:
        if re.search(pattern, sanitized, re.IGNORECASE):
            security_monitor.log_security_event('XSS_ATTEMPT_DETECTED', {
                'pattern': pattern,
                'content_preview': content[:200]
            }, request)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid content: contains potentially dangerous HTML"
            )
    
    return sanitized.strip()

def get_security_report() -> Dict[str, Any]:
    """Get a comprehensive security report."""
    return security_monitor.get_security_report() 