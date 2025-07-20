from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
import asyncio
import dns.resolver
import dns.reversename
import logging
import re
import httpx
from email.utils import parseaddr

logger = logging.getLogger(__name__)

router = APIRouter()

class EmailBlacklistResult(BaseModel):
    domain: str
    is_blacklisted: bool
    blacklisted_on: List[str] = []
    reputation_score: Optional[float] = None
    reputation_status: str = "unknown"  # good, suspicious, bad, unknown
    mx_records: List[str] = []
    domain_age_days: Optional[int] = None
    details: Dict[str, Any] = {}

class EmailBlacklistResponse(BaseModel):
    email: str
    domain: str
    is_valid_email: bool
    overall_status: str  # safe, suspicious, dangerous, unknown
    risk_score: float  # 0-100 (0=safe, 100=dangerous)
    results: EmailBlacklistResult
    checks_performed: List[str]
    execution_time: float
    success: bool
    error_message: Optional[str] = None

class EmailBlacklistRequest(BaseModel):
    email: str
    include_reputation: bool = True

# Domain reputation blacklists (domain-based, not IP-based)
DOMAIN_BLACKLISTS = [
    "dbl.spamhaus.org",      # Spamhaus Domain Block List
    "surbl.org",             # SURBL URI blacklist
    "uribl.com",             # URIBL
    "multi.surbl.org",       # Multi SURBL
    "phishing.rbl.msrbl.net", # Microsoft RBL
    "black.uribl.com",       # URIBL Black
    "grey.uribl.com",        # URIBL Grey
    "multi.uribl.com",       # Multi URIBL
    "dnsbl.sorbs.net",       # SORBS
    "zen.spamhaus.org"       # Spamhaus Zen (includes domains)
]

def extract_domain_from_email(email: str) -> Optional[str]:
    """Extract domain from email address"""
    try:
        parsed = parseaddr(email)
        if '@' in parsed[1]:
            return parsed[1].split('@')[1].lower()
        return None
    except:
        # Fallback simple extraction
        if '@' in email:
            return email.split('@')[1].lower()
        return None

def is_valid_email_format(email: str) -> bool:
    """Basic email format validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

async def check_domain_blacklist(domain: str, blacklist: str) -> Optional[str]:
    """Check if domain is in a specific blacklist"""
    try:
        # Create the query domain
        query_domain = f"{domain}.{blacklist}"
        
        # Perform DNS lookup
        resolver = dns.resolver.Resolver()
        resolver.timeout = 3
        resolver.lifetime = 3
        
        answers = resolver.resolve(query_domain, 'A')
        
        # If we get an answer, the domain is listed
        for answer in answers:
            return str(answer)
            
    except dns.resolver.NXDOMAIN:
        # Domain not in blacklist (good)
        pass
    except dns.resolver.Timeout:
        logger.warning(f"Timeout checking {domain} against {blacklist}")
    except Exception as e:
        logger.warning(f"Error checking {domain} against {blacklist}: {str(e)}")
    
    return None

async def get_mx_records(domain: str) -> List[str]:
    """Get MX records for the domain"""
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = 5
        resolver.lifetime = 5
        
        answers = resolver.resolve(domain, 'MX')
        mx_records = []
        
        for answer in answers:
            mx_records.append(str(answer.exchange).rstrip('.'))
            
        return sorted(mx_records)
        
    except Exception as e:
        logger.warning(f"Could not get MX records for {domain}: {str(e)}")
        return []

async def check_domain_reputation_online(domain: str) -> Dict[str, Any]:
    """Check domain reputation using online services (if available)"""
    reputation_data = {
        "score": None,
        "status": "unknown",
        "details": {}
    }
    
    try:
        # This would normally use reputation APIs like VirusTotal, URLVoid, etc.
        # For now, we'll do basic checks
        
        # Check if domain looks suspicious
        suspicious_keywords = [
            "temp", "temporary", "disposable", "throwaway", "fake", "spam",
            "test", "example", "guerrilla", "mailinator", "10minute"
        ]
        
        is_suspicious = any(keyword in domain.lower() for keyword in suspicious_keywords)
        
        if is_suspicious:
            reputation_data["score"] = 70.0  # Suspicious
            reputation_data["status"] = "suspicious"
            reputation_data["details"]["reason"] = "Domain contains suspicious keywords"
        else:
            # Check domain structure
            if len(domain.split('.')) > 3:  # Too many subdomains might be suspicious
                reputation_data["score"] = 60.0
                reputation_data["status"] = "suspicious"
                reputation_data["details"]["reason"] = "Complex subdomain structure"
            elif domain.endswith('.tk') or domain.endswith('.ml') or domain.endswith('.ga'):
                # Free TLDs often used for spam
                reputation_data["score"] = 65.0
                reputation_data["status"] = "suspicious"
                reputation_data["details"]["reason"] = "Free TLD often used for spam"
            else:
                reputation_data["score"] = 20.0  # Probably safe
                reputation_data["status"] = "good"
                reputation_data["details"]["reason"] = "No obvious red flags"
                
    except Exception as e:
        logger.warning(f"Error checking domain reputation for {domain}: {str(e)}")
        
    return reputation_data

def calculate_risk_score(blacklist_results: List[str], reputation_score: Optional[float], mx_count: int) -> float:
    """Calculate overall risk score (0-100)"""
    risk = 0.0
    
    # Blacklist factor (0-70 points)
    if blacklist_results:
        risk += min(70.0, len(blacklist_results) * 15.0)
    
    # Reputation factor (0-25 points)
    if reputation_score is not None:
        risk += (reputation_score / 100.0) * 25.0
    
    # MX records factor (0-5 points)
    if mx_count == 0:
        risk += 5.0  # No MX records is suspicious
    
    return min(100.0, risk)

def determine_overall_status(risk_score: float) -> str:
    """Determine overall status based on risk score"""
    if risk_score >= 70:
        return "dangerous"
    elif risk_score >= 40:
        return "suspicious"
    elif risk_score >= 20:
        return "caution"
    else:
        return "safe"

@router.post("/email-blacklist-check", response_model=EmailBlacklistResponse)
async def check_email_blacklist(
    email: str = Query(..., description="Email address to check"),
    include_reputation: bool = Query(True, description="Include domain reputation analysis")
):
    """
    Check if an email domain is blacklisted and assess its reputation
    """
    logger.info(f"Starting email blacklist check for: {email}")
    
    start_time = asyncio.get_event_loop().time()
    checks_performed = []
    
    try:
        # Validate email format
        email = email.strip().lower()
        is_valid = is_valid_email_format(email)
        
        if not is_valid:
            execution_time = asyncio.get_event_loop().time() - start_time
            return EmailBlacklistResponse(
                email=email,
                domain="",
                is_valid_email=False,
                overall_status="unknown",
                risk_score=0.0,
                results=EmailBlacklistResult(domain="", is_blacklisted=False),
                checks_performed=[],
                execution_time=execution_time,
                success=False,
                error_message="Invalid email format"
            )
        
        # Extract domain
        domain = extract_domain_from_email(email)
        if not domain:
            execution_time = asyncio.get_event_loop().time() - start_time
            return EmailBlacklistResponse(
                email=email,
                domain="",
                is_valid_email=False,
                overall_status="unknown",
                risk_score=0.0,
                results=EmailBlacklistResult(domain="", is_blacklisted=False),
                checks_performed=[],
                execution_time=execution_time,
                success=False,
                error_message="Could not extract domain from email"
            )
        
        logger.info(f"Checking domain: {domain}")
        
        # Check domain blacklists
        checks_performed.append("domain_blacklists")
        blacklist_tasks = [check_domain_blacklist(domain, bl) for bl in DOMAIN_BLACKLISTS]
        blacklist_results = await asyncio.gather(*blacklist_tasks, return_exceptions=True)
        
        # Filter successful results
        found_in_blacklists = []
        for i, result in enumerate(blacklist_results):
            if isinstance(result, str) and result:  # Found in blacklist
                found_in_blacklists.append(DOMAIN_BLACKLISTS[i])
            elif isinstance(result, Exception):
                logger.warning(f"Error checking {DOMAIN_BLACKLISTS[i]}: {str(result)}")
        
        logger.info(f"Domain {domain} found in {len(found_in_blacklists)} blacklists: {found_in_blacklists}")
        
        # Get MX records
        checks_performed.append("mx_records")
        mx_records = await get_mx_records(domain)
        logger.info(f"Found {len(mx_records)} MX records for {domain}")
        
        # Check domain reputation
        reputation_data = {"score": None, "status": "unknown", "details": {}}
        if include_reputation:
            checks_performed.append("domain_reputation")
            reputation_data = await check_domain_reputation_online(domain)
        
        # Calculate risk score
        risk_score = calculate_risk_score(found_in_blacklists, reputation_data["score"], len(mx_records))
        overall_status = determine_overall_status(risk_score)
        
        # Create detailed results
        results = EmailBlacklistResult(
            domain=domain,
            is_blacklisted=len(found_in_blacklists) > 0,
            blacklisted_on=found_in_blacklists,
            reputation_score=reputation_data["score"],
            reputation_status=reputation_data["status"],
            mx_records=mx_records,
            details={
                "blacklist_count": len(found_in_blacklists),
                "mx_record_count": len(mx_records),
                "reputation_details": reputation_data["details"]
            }
        )
        
        execution_time = asyncio.get_event_loop().time() - start_time
        
        logger.info(f"Email blacklist check completed for {email}: risk_score={risk_score:.1f}, status={overall_status}")
        
        return EmailBlacklistResponse(
            email=email,
            domain=domain,
            is_valid_email=True,
            overall_status=overall_status,
            risk_score=round(risk_score, 1),
            results=results,
            checks_performed=checks_performed,
            execution_time=execution_time,
            success=True
        )
        
    except Exception as e:
        execution_time = asyncio.get_event_loop().time() - start_time
        error_msg = f"Error during email blacklist check: {str(e)}"
        logger.error(error_msg)
        
        return EmailBlacklistResponse(
            email=email,
            domain=domain if 'domain' in locals() else "",
            is_valid_email=is_valid if 'is_valid' in locals() else False,
            overall_status="unknown",
            risk_score=0.0,
            results=EmailBlacklistResult(domain=domain if 'domain' in locals() else "", is_blacklisted=False),
            checks_performed=checks_performed,
            execution_time=execution_time,
            success=False,
            error_message=error_msg
        )

@router.get("/email-blacklist-check", response_model=EmailBlacklistResponse)
async def get_email_blacklist_check(
    email: str = Query(..., description="Email address to check"),
    include_reputation: bool = Query(True, description="Include domain reputation analysis")
):
    """
    Check if an email domain is blacklisted and assess its reputation (GET method for convenience)
    """
    return await check_email_blacklist(email, include_reputation)

@router.post("/email-blacklist", response_model=EmailBlacklistResponse)
async def check_email_blacklist_post(
    request: EmailBlacklistRequest
):
    """
    Check if an email domain is blacklisted and assess its reputation (JSON body version)
    """
    return await check_email_blacklist(request.email, request.include_reputation) 