from fastapi import APIRouter, HTTPException, Query
from app.models.ip_models import BlacklistCheck, BlacklistResponse, BlacklistItem
import re
import socket
import asyncio
import logging
import ipaddress
from typing import List

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Common DNSBL services (real blacklist services)
BLACKLIST_SERVICES = [
    "zen.spamhaus.org",
    "bl.spamcop.net", 
    "b.barracudacentral.org",
    "dnsbl.sorbs.net",
    "psbl.surriel.com",
    "ubl.unsubscore.com",
    "dnsbl-1.uceprotect.net",
    "dnsbl-2.uceprotect.net",
    "dnsbl-3.uceprotect.net",
    "truncate.gbudb.net",
    "cbl.abuseat.org",
    "pbl.spamhaus.org",
    "sbl.spamhaus.org",
    "css.spamhaus.org"
]

@router.post("/blacklist-check", response_model=BlacklistResponse)
async def check_ip_blacklist(request: BlacklistCheck):
    """
    Check if an IP address is listed in real spam/blacklist databases using DNSBL queries.
    """
    return await _check_ip_blacklist_impl(request.ip, request.blacklists)

@router.get("/blacklist-check", response_model=BlacklistResponse)
async def check_ip_blacklist_get(ip: str = Query(..., description="IP address to check")):
    """
    Check if an IP address is listed in real spam/blacklist databases using DNSBL queries (GET version).
    """
    return await _check_ip_blacklist_impl(ip, None)

async def _check_ip_blacklist_impl(ip: str, blacklists: List[str] = None):
    """
    Internal implementation for blacklist checking.
    """
    try:
        # Validate IP address
        if not is_valid_ip(ip):
            raise HTTPException(status_code=400, detail="Invalid IP address")
        
        # Use provided blacklists or default ones
        blacklists = blacklists if blacklists else BLACKLIST_SERVICES
        
        # Limit number of blacklists to check (prevent abuse)
        if len(blacklists) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 blacklists per request")
        
        logger.info(f"Checking IP {ip} against {len(blacklists)} blacklists")
        
        # Check each blacklist concurrently for better performance
        tasks = []
        for blacklist in blacklists:
            task = check_dnsbl_real(ip, blacklist)
            tasks.append(task)
        
        # Execute all checks concurrently
        blacklist_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        results = []
        listed_count = 0
        
        for i, result in enumerate(blacklist_results):
            blacklist = blacklists[i]
            
            if isinstance(result, Exception):
                logger.warning(f"Blacklist check failed for {blacklist}: {result}")
                results.append(BlacklistItem(
                    blacklist=blacklist,
                    listed=False,
                    details=f"Query failed: {str(result)}"
                ))
            else:
                is_listed, details = result
                if is_listed:
                    listed_count += 1
                
                results.append(BlacklistItem(
                    blacklist=blacklist,
                    listed=is_listed,
                    details=details
                ))
        
        logger.info(f"Blacklist check completed for {ip}: {listed_count}/{len(blacklists)} lists found the IP")
        
        # Create lists for frontend compatibility  
        blacklisted_on = [item.blacklist for item in results if item.listed]
        clean_on = [item.blacklist for item in results if not item.listed]
        
        # Create details dict for frontend compatibility
        details = {}
        for item in results:
            details[item.blacklist] = {
                "listed": item.listed,
                "response_time": 0.0,  # We don't track this currently
                "error": item.details if not item.listed and "error" in item.details.lower() else None
            }
        
        return BlacklistResponse(
            ip=ip,
            results=results,
            total_checked=len(blacklists),
            listed_count=listed_count,
            # Add frontend compatibility fields
            is_blacklisted=(listed_count > 0),
            total_lists=len(blacklists),
            blacklisted_on=blacklisted_on,
            clean_on=clean_on,
            details=details
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Blacklist check failed for {ip}: {e}")
        raise HTTPException(status_code=500, detail=f"Blacklist check failed: {str(e)}")

async def check_dnsbl_real(ip: str, blacklist: str) -> tuple[bool, str]:
    """
    Real DNSBL checking implementation using DNS queries.
    """
    try:
        # Reverse IP for DNSBL query (e.g., 192.168.1.1 -> 1.1.168.192)
        reversed_ip = '.'.join(reversed(ip.split('.')))
        query_host = f"{reversed_ip}.{blacklist}"
        
        logger.debug(f"Querying {query_host}")
        
        # Perform DNS lookup with timeout
        try:
            # Run DNS query in executor to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                lambda: socket.gethostbyname(query_host)
            )
            
            # If we get a response, the IP is listed
            logger.info(f"IP {ip} found in blacklist {blacklist} (response: {result})")
            
            # Get additional details based on response code
            details = get_blacklist_details(result, blacklist)
            return True, details
            
        except socket.gaierror:
            # No DNS record means IP is not listed
            logger.debug(f"IP {ip} not found in blacklist {blacklist}")
            return False, "Clean - not listed"
            
        except asyncio.TimeoutError:
            logger.warning(f"Timeout querying {blacklist} for {ip}")
            return False, "Query timeout"
            
    except Exception as e:
        logger.error(f"DNSBL query failed for {ip} on {blacklist}: {e}")
        return False, f"Query error: {str(e)}"

def get_blacklist_details(response_ip: str, blacklist: str) -> str:
    """
    Get detailed information based on DNSBL response codes.
    """
    try:
        # Different blacklists use different response codes
        if "spamhaus" in blacklist.lower():
            if response_ip.startswith("127.0.0.2"):
                return "SBL - Spamhaus Block List"
            elif response_ip.startswith("127.0.0.3"):
                return "CSS - Spamhaus CSS List"
            elif response_ip.startswith("127.0.0.9"):
                return "PBL - Policy Block List"
            elif response_ip.startswith("127.0.0.10"):
                return "Dynamic IP range"
            elif response_ip.startswith("127.0.0.11"):
                return "End-user IP range"
            else:
                return f"Listed in Spamhaus (code: {response_ip})"
        
        elif "barracuda" in blacklist.lower():
            return "Listed in Barracuda Reputation Block List"
        
        elif "spamcop" in blacklist.lower():
            return "Listed in SpamCop Block List"
        
        elif "sorbs" in blacklist.lower():
            return "Listed in SORBS database"
        
        elif "uceprotect" in blacklist.lower():
            return "Listed in UCEPROTECT database"
        
        else:
            return f"Listed (response: {response_ip})"
            
    except:
        return f"Listed (response: {response_ip})"

def is_valid_ip(ip: str) -> bool:
    """
    Validate IP address format (IPv4 only for DNSBL).
    """
    try:
        # Parse as IPv4 address
        addr = ipaddress.IPv4Address(ip)
        
        # Skip private/reserved IP ranges for DNSBL checks
        if addr.is_private or addr.is_reserved or addr.is_loopback or addr.is_multicast:
            return False
            
        return True
    except ipaddress.AddressValueError:
        return False

@router.get("/blacklist-services")
async def get_blacklist_services():
    """
    Get a list of available blacklist services with descriptions.
    """
    service_descriptions = {
        "zen.spamhaus.org": "Spamhaus ZEN - Combined blocking list",
        "bl.spamcop.net": "SpamCop - User-reported spam sources",
        "b.barracudacentral.org": "Barracuda - Reputation-based blocking",
        "dnsbl.sorbs.net": "SORBS - Spam and Open Relay Blocking",
        "psbl.surriel.com": "Passive Spam Block List",
        "ubl.unsubscore.com": "Invaluement UBL",
        "dnsbl-1.uceprotect.net": "UCEPROTECT Level 1",
        "dnsbl-2.uceprotect.net": "UCEPROTECT Level 2", 
        "dnsbl-3.uceprotect.net": "UCEPROTECT Level 3",
        "truncate.gbudb.net": "GoodBadUgly Database",
        "cbl.abuseat.org": "Composite Blocking List",
        "pbl.spamhaus.org": "Spamhaus Policy Block List",
        "sbl.spamhaus.org": "Spamhaus Block List",
        "css.spamhaus.org": "Spamhaus CSS List"
    }
    
    return {
        "services": [
            {
                "name": service,
                "description": service_descriptions.get(service, "DNS Blacklist service")
            }
            for service in BLACKLIST_SERVICES
        ],
        "total_services": len(BLACKLIST_SERVICES)
    }

@router.get("/ip-reputation")
async def check_ip_reputation(ip: str = Query(..., description="IP address to check reputation")):
    """
    Check IP reputation across multiple sources for a comprehensive view.
    """
    try:
        if not is_valid_ip(ip):
            raise HTTPException(status_code=400, detail="Invalid IP address format")
        
        logger.info(f"Checking comprehensive reputation for IP {ip}")
        
        # Check against major reputation services
        major_services = [
            "zen.spamhaus.org",
            "bl.spamcop.net",
            "b.barracudacentral.org",
            "cbl.abuseat.org"
        ]
        
        tasks = []
        for service in major_services:
            task = check_dnsbl_real(ip, service)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        reputation_score = 0
        total_checks = 0
        listed_services = []
        
        for i, result in enumerate(results):
            service = major_services[i]
            total_checks += 1
            
            if isinstance(result, Exception):
                continue
                
            is_listed, details = result
            if is_listed:
                reputation_score += 1
                listed_services.append({
                    "service": service,
                    "details": details
                })
        
        # Calculate reputation percentage (lower is better)
        reputation_percentage = (reputation_score / total_checks * 100) if total_checks > 0 else 0
        
        # Determine reputation status
        if reputation_percentage == 0:
            status = "clean"
        elif reputation_percentage <= 25:
            status = "mostly_clean"
        elif reputation_percentage <= 50:
            status = "suspicious"
        elif reputation_percentage <= 75:
            status = "bad"
        else:
            status = "very_bad"
        
        return {
            "ip": ip,
            "reputation_score": reputation_score,
            "total_checks": total_checks,
            "reputation_percentage": round(reputation_percentage, 1),
            "status": status,
            "listed_services": listed_services,
            "recommendation": get_reputation_recommendation(status)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"IP reputation check failed for {ip}: {e}")
        raise HTTPException(status_code=500, detail=f"IP reputation check failed: {str(e)}")

def get_reputation_recommendation(status: str) -> str:
    """Get recommendation based on reputation status."""
    recommendations = {
        "clean": "IP has good reputation - safe to whitelist",
        "mostly_clean": "IP has mostly good reputation - generally safe",
        "suspicious": "IP has mixed reputation - monitor closely",
        "bad": "IP has poor reputation - consider blocking",
        "very_bad": "IP has very poor reputation - recommend blocking"
    }
    return recommendations.get(status, "Unknown status")

@router.get("/email-blacklist-check")
async def check_email_blacklist(email: str):
    """
    Check if an email domain is blacklisted.
    """
    try:
        # Extract domain from email
        if '@' not in email:
            raise HTTPException(status_code=400, detail="Invalid email address")
        
        domain = email.split('@')[1].lower()
        
        logger.info(f"Checking email domain blacklist for {domain}")
        
        # For demonstration, check if domain resolves and basic checks
        try:
            # Check if domain has MX records
            import dns.resolver
            mx_records = dns.resolver.resolve(domain, 'MX')
            has_mx = len(mx_records) > 0
        except:
            has_mx = False
        
        # Known spam domains (basic list for demo)
        known_spam_domains = [
            "tempmail.org", "10minutemail.com", "guerrillamail.com",
            "mailinator.com", "temp-mail.org", "throwaway.email"
        ]
        
        is_temporary = domain in known_spam_domains
        is_suspicious = not has_mx or is_temporary
        
        return {
            "email": email,
            "domain": domain,
            "has_mx_records": has_mx,
            "is_temporary": is_temporary,
            "is_suspicious": is_suspicious,
            "status": "suspicious" if is_suspicious else "clean",
            "recommendation": "Block or verify" if is_suspicious else "Allow"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email blacklist check failed for {email}: {e}")
        raise HTTPException(status_code=500, detail=f"Email blacklist check failed: {str(e)}")

