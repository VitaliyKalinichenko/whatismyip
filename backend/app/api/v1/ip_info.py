from fastapi import APIRouter, Request, HTTPException
from app.models.ip_models import IPInfo
import httpx
import json
import logging
import time
import asyncio

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple in-memory cache for IP info (cache for 5 minutes)
_ip_cache = {}
_cache_ttl = 300  # 5 minutes in seconds

# Enhanced country code to flag mapping
COUNTRY_FLAGS = {
    "AD": "🇦🇩", "AE": "🇦🇪", "AF": "🇦🇫", "AG": "🇦🇬", "AI": "🇦🇮",
    "AL": "🇦🇱", "AM": "🇦🇲", "AO": "🇦🇴", "AQ": "🇦🇶", "AR": "🇦🇷",
    "AS": "🇦🇸", "AT": "🇦🇹", "AU": "🇦🇺", "AW": "🇦🇼", "AX": "🇦🇽",
    "AZ": "🇦🇿", "BA": "🇧🇦", "BB": "🇧🇧", "BD": "🇧🇩", "BE": "🇧🇪",
    "BF": "🇧🇫", "BG": "🇧🇬", "BH": "🇧🇭", "BI": "🇧🇮", "BJ": "🇧🇯",
    "BL": "🇧🇱", "BM": "🇧🇲", "BN": "🇧🇳", "BO": "🇧🇴", "BQ": "🇧🇶",
    "BR": "🇧🇷", "BS": "🇧🇸", "BT": "🇧🇹", "BV": "🇧🇻", "BW": "🇧🇼",
    "BY": "🇧🇾", "BZ": "🇧🇿", "CA": "🇨🇦", "CC": "🇨🇨", "CD": "🇨🇩",
    "CF": "🇨🇫", "CG": "🇨🇬", "CH": "🇨🇭", "CI": "🇨🇮", "CK": "🇨🇰",
    "CL": "🇨🇱", "CM": "🇨🇲", "CN": "🇨🇳", "CO": "🇨🇴", "CR": "🇨🇷",
    "CU": "🇨🇺", "CV": "🇨🇻", "CW": "🇨🇼", "CX": "🇨🇽", "CY": "🇨🇾",
    "CZ": "🇨🇿", "DE": "🇩🇪", "DJ": "🇩🇯", "DK": "🇩🇰", "DM": "🇩🇲",
    "DO": "🇩🇴", "DZ": "🇩🇿", "EC": "🇪🇨", "EE": "🇪🇪", "EG": "🇪🇬",
    "EH": "🇪🇭", "ER": "🇪🇷", "ES": "🇪🇸", "ET": "🇪🇹", "FI": "🇫🇮",
    "FJ": "🇫🇯", "FK": "🇫🇰", "FM": "🇫🇲", "FO": "🇫🇴", "FR": "🇫🇷",
    "GA": "🇬🇦", "GB": "🇬🇧", "GD": "🇬🇩", "GE": "🇬🇪", "GF": "🇬🇫",
    "GG": "🇬🇬", "GH": "🇬🇭", "GI": "🇬🇮", "GL": "🇬🇱", "GM": "🇬🇲",
    "GN": "🇬🇳", "GP": "🇬🇵", "GQ": "🇬🇶", "GR": "🇬🇷", "GS": "🇬🇸",
    "GT": "🇬🇹", "GU": "🇬🇺", "GW": "🇬🇼", "GY": "🇬🇾", "HK": "🇭🇰",
    "HM": "🇭🇲", "HN": "🇭🇳", "HR": "🇭🇷", "HT": "🇭🇹", "HU": "🇭🇺",
    "ID": "🇮🇩", "IE": "🇮🇪", "IL": "🇮🇱", "IM": "🇮🇲", "IN": "🇮🇳",
    "IO": "🇮🇴", "IQ": "🇮🇶", "IR": "🇮🇷", "IS": "🇮🇸", "IT": "🇮🇹",
    "JE": "🇯🇪", "JM": "🇯🇲", "JO": "🇯🇴", "JP": "🇯🇵", "KE": "🇰🇪",
    "KG": "🇰🇬", "KH": "🇰🇭", "KI": "🇰🇮", "KM": "🇰🇲", "KN": "🇰🇳",
    "KP": "🇰🇵", "KR": "🇰🇷", "KW": "🇰🇼", "KY": "🇰🇾", "KZ": "🇰🇿",
    "LA": "🇱🇦", "LB": "🇱🇧", "LC": "🇱🇨", "LI": "🇱🇮", "LK": "🇱🇰",
    "LR": "🇱🇷", "LS": "🇱🇸", "LT": "🇱🇹", "LU": "🇱🇺", "LV": "🇱🇻",
    "LY": "🇱🇾", "MA": "🇲🇦", "MC": "🇲🇨", "MD": "🇲🇩", "ME": "🇲🇪",
    "MF": "🇲🇫", "MG": "🇲🇬", "MH": "🇲🇭", "MK": "🇲🇰", "ML": "🇲🇱",
    "MM": "🇲🇲", "MN": "🇲🇳", "MO": "🇲🇴", "MP": "🇲🇵", "MQ": "🇲🇶",
    "MR": "🇲🇷", "MS": "🇲🇸", "MT": "🇲🇹", "MU": "🇲🇺", "MV": "🇲🇻",
    "MW": "🇲🇼", "MX": "🇲🇽", "MY": "🇲🇾", "MZ": "🇲🇿", "NA": "🇳🇦",
    "NC": "🇳🇨", "NE": "🇳🇪", "NF": "🇳🇫", "NG": "🇳🇬", "NI": "🇳🇮",
    "NL": "🇳🇱", "NO": "🇳🇴", "NP": "🇳🇵", "NR": "🇳🇷", "NU": "🇳🇺",
    "NZ": "🇳🇿", "OM": "🇴🇲", "PA": "🇵🇦", "PE": "🇵🇪", "PF": "🇵🇫",
    "PG": "🇵🇬", "PH": "🇵🇭", "PK": "🇵🇰", "PL": "🇵🇱", "PM": "🇵🇲",
    "PN": "🇵🇳", "PR": "🇵🇷", "PS": "🇵🇸", "PT": "🇵🇹", "PW": "🇵🇼",
    "PY": "🇵🇾", "QA": "🇶🇦", "RE": "🇷🇪", "RO": "🇷🇴", "RS": "🇷🇸",
    "RU": "🇷🇺", "RW": "🇷🇼", "SA": "🇸🇦", "SB": "🇸🇧", "SC": "🇸🇨",
    "SD": "🇸🇩", "SE": "🇸🇪", "SG": "🇸🇬", "SH": "🇸🇭", "SI": "🇸🇮",
    "SJ": "🇸🇯", "SK": "🇸🇰", "SL": "🇸🇱", "SM": "🇸🇲", "SN": "🇸🇳",
    "SO": "🇸🇴", "SR": "🇸🇷", "SS": "🇸🇸", "ST": "🇸🇹", "SV": "🇸🇻",
    "SX": "🇸🇽", "SY": "🇸🇾", "SZ": "🇸🇿", "TC": "🇹🇨", "TD": "🇹🇩",
    "TF": "🇹🇫", "TG": "🇹🇬", "TH": "🇹🇭", "TJ": "🇹🇯", "TK": "🇹🇰",
    "TL": "🇹🇱", "TM": "🇹🇲", "TN": "🇹🇳", "TO": "🇹🇴", "TR": "🇹🇷",
    "TT": "🇹🇹", "TV": "🇹🇻", "TW": "🇹🇼", "TZ": "🇹🇿", "UA": "🇺🇦",
    "UG": "🇺🇬", "UM": "🇺🇲", "US": "🇺🇸", "UY": "🇺🇾", "UZ": "🇺🇿",
    "VA": "🇻🇦", "VC": "🇻🇨", "VE": "🇻🇪", "VG": "🇻🇬", "VI": "🇻🇮",
    "VN": "🇻🇳", "VU": "🇻🇺", "WF": "🇼🇫", "WS": "🇼🇸", "YE": "🇾🇪",
    "YT": "🇾🇹", "ZA": "🇿🇦", "ZM": "🇿🇲", "ZW": "🇿🇼"
}

async def get_real_public_ip() -> str:
    """
    Get the real public IP address with fast, optimized parallel requests.
    """
    ip_services = [
        "https://api.ipify.org?format=json",  # Usually fastest
        "https://httpbin.org/ip",
        "https://ipapi.co/ip/",
    ]
    
    # Try all services in parallel with very short timeout
    async def try_ip_service(service):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(service, timeout=3.0)  # Increased timeout
                if response.status_code == 200:
                    # Handle different response formats
                    if service == "https://ipapi.co/ip/":
                        # This service returns plain text
                        ip = response.text.strip()
                    else:
                        # These services return JSON
                        try:
                            data = response.json()
                            ip = None
                            if "ip" in data:
                                ip = data["ip"]
                            elif "origin" in data:
                                ip = data["origin"]
                        except:
                            # If JSON parsing fails, try text
                            ip = response.text.strip()
                    
                    # Validate IP address
                    if ip and ip != "127.0.0.1" and not ip.startswith("192.168.") and not ip.startswith("10."):
                        logger.info(f"Successfully got real public IP: {ip} from {service}")
                        return ip
                        
        except Exception as e:
            logger.warning(f"Failed to get IP from {service}: {e}")
            return None
    
    # Try services one by one (faster than parallel for this use case)
    for service in ip_services:
        try:
            result = await try_ip_service(service)
            if result:
                return result
        except Exception as e:
            logger.warning(f"Service {service} failed: {e}")
            continue
    
    logger.error("All IP services failed, returning fallback")
    return "127.0.0.1"

async def get_real_ip_info(ip: str) -> IPInfo:
    """
    Get real IP information with optimized performance and fast fallbacks.
    """
    
    # For localhost/development, get the real public IP instead of using mock data
    if ip == "127.0.0.1" or ip.startswith("192.168.") or ip.startswith("10."):
        logger.info(f"Development mode: detecting real public IP instead of {ip}")
        # Get the real public IP from external services
        real_ip = await get_real_public_ip()
        if real_ip != "127.0.0.1":
            ip = real_ip
            logger.info(f"Real public IP detected: {ip}")
        else:
            logger.warning("Could not detect real public IP, using mock data")
            # Fallback to mock data only if we can't get real IP
            return IPInfo(
                ip="Unable to detect",
                city="Unknown",
                region="Unknown",
                country="Unknown",
                country_code="XX",
                isp="Unknown ISP",
                timezone="UTC",
                currency="USD",
                calling_code="+1",
                flag="XX",
                latitude=0.0,
                longitude=0.0
            )
    
    # For real IPs, use optimized parallel requests
    services = [
        {
            "name": "ip-api.com",
            "url": f"http://ip-api.com/json/{ip}",
            "timeout": 1.0  # Very fast timeout
        },
        {
            "name": "ipapi.co",
            "url": f"https://ipapi.co/{ip}/json/",
            "timeout": 1.0
        }
    ]
    
    # Try services in parallel with fast timeout
    async def try_service(service):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(service["url"], timeout=service["timeout"])
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Got response from {service['name']}: {data}")
                    
                    if service["name"] == "ipapi.co":
                        return parse_ipapi_response(ip, data)
                    elif service["name"] == "ip-api.com":
                        return parse_ipapi_com_response(ip, data)
                        
        except Exception as e:
            logger.warning(f"Service {service['name']} failed: {e}")
            return None
    
    # Try services one by one for better reliability
    for service in services:
        try:
            logger.info(f"Trying service: {service['name']}")
            result = await try_service(service)
            if result:
                logger.info(f"Successfully got IP info from {service['name']}")
                return result
        except Exception as e:
            logger.warning(f"Service {service['name']} failed: {e}")
            continue
    
    logger.error("All geolocation services failed")
    # Fast fallback with basic info
    return IPInfo(
        ip=ip,
        city="Unknown",
        region="Unknown", 
        country="Unknown",
        country_code="XX",
        isp="Unknown ISP",
        timezone="UTC",
        currency="USD",
        calling_code="+1",
        flag="XX"
    )

def parse_ipapi_response(ip: str, data: dict) -> IPInfo:
    """Parse response from ipapi.co"""
    return IPInfo(
        ip=ip,
        city=data.get("city", "Unknown"),
        region=data.get("region", "Unknown"),
        country=data.get("country_name", "Unknown"),
        country_code=data.get("country_code", "XX"),
        isp=data.get("org", "Unknown ISP"),
        timezone=data.get("timezone", "UTC"),
        currency=data.get("currency", "USD"),
        calling_code=data.get("country_calling_code", "+1"),
        flag=data.get("country_code", "XX"),  # Return country code instead of flag emoji
        latitude=data.get("latitude"),
        longitude=data.get("longitude")
    )

def parse_ipapi_com_response(ip: str, data: dict) -> IPInfo:
    """Parse response from ip-api.com"""
    country_code = data.get("countryCode", "XX")
    
    # Map country codes to calling codes and currencies
    country_info = {
        "UA": {"calling_code": "+380", "currency": "UAH"},
        "US": {"calling_code": "+1", "currency": "USD"},
        "GB": {"calling_code": "+44", "currency": "GBP"},
        "DE": {"calling_code": "+49", "currency": "EUR"},
        "FR": {"calling_code": "+33", "currency": "EUR"},
        "CA": {"calling_code": "+1", "currency": "CAD"},
        "AU": {"calling_code": "+61", "currency": "AUD"},
        "JP": {"calling_code": "+81", "currency": "JPY"},
        "CN": {"calling_code": "+86", "currency": "CNY"},
        "IN": {"calling_code": "+91", "currency": "INR"},
        "BR": {"calling_code": "+55", "currency": "BRL"},
        "RU": {"calling_code": "+7", "currency": "RUB"},
        "PL": {"calling_code": "+48", "currency": "PLN"},
        "IT": {"calling_code": "+39", "currency": "EUR"},
        "ES": {"calling_code": "+34", "currency": "EUR"},
        "NL": {"calling_code": "+31", "currency": "EUR"},
        "SE": {"calling_code": "+46", "currency": "SEK"},
        "NO": {"calling_code": "+47", "currency": "NOK"},
        "DK": {"calling_code": "+45", "currency": "DKK"},
        "FI": {"calling_code": "+358", "currency": "EUR"},
        "CH": {"calling_code": "+41", "currency": "CHF"},
        "AT": {"calling_code": "+43", "currency": "EUR"},
        "BE": {"calling_code": "+32", "currency": "EUR"},
        "IE": {"calling_code": "+353", "currency": "EUR"},
        "PT": {"calling_code": "+351", "currency": "EUR"},
        "GR": {"calling_code": "+30", "currency": "EUR"},
        "CZ": {"calling_code": "+420", "currency": "CZK"},
        "HU": {"calling_code": "+36", "currency": "HUF"},
        "RO": {"calling_code": "+40", "currency": "RON"},
        "BG": {"calling_code": "+359", "currency": "BGN"},
        "HR": {"calling_code": "+385", "currency": "EUR"},
        "SI": {"calling_code": "+386", "currency": "EUR"},
        "SK": {"calling_code": "+421", "currency": "EUR"},
        "LT": {"calling_code": "+370", "currency": "EUR"},
        "LV": {"calling_code": "+371", "currency": "EUR"},
        "EE": {"calling_code": "+372", "currency": "EUR"},
        "MT": {"calling_code": "+356", "currency": "EUR"},
        "CY": {"calling_code": "+357", "currency": "EUR"},
        "LU": {"calling_code": "+352", "currency": "EUR"},
    }
    
    country_data = country_info.get(country_code, {"calling_code": "+1", "currency": "USD"})
    
    return IPInfo(
        ip=ip,
        city=data.get("city", "Unknown"),
        region=data.get("regionName", "Unknown"),
        country=data.get("country", "Unknown"),
        country_code=country_code,
        isp=data.get("isp", "Unknown ISP"),
        timezone=data.get("timezone", "UTC"),
        currency=country_data["currency"],
        calling_code=country_data["calling_code"],
        flag=country_code,  # Return country code instead of flag emoji for CountryMap component
        latitude=data.get("lat"),
        longitude=data.get("lon")
    )

def get_client_ip(request: Request) -> str:
    """Get client IP address from request headers"""
    # Check for proxy headers first
    forwarded_for = request.headers.get("X-Forwarded-For")
    real_ip = request.headers.get("X-Real-IP")
    
    if forwarded_for:
        # Take the first IP from the X-Forwarded-For header
        return forwarded_for.split(',')[0].strip()
    elif real_ip:
        return real_ip
    else:
        return request.client.host

@router.get("/ip-info", response_model=IPInfo)
async def get_ip_info(request: Request, ip: str = None):
    """
    Get detailed information about an IP address including geolocation, ISP, and more.
    Optimized for fast response times.
    """
    try:
        # Get client IP if none provided
        if not ip:
            ip = get_client_ip(request)
        
        logger.info(f"Getting IP info for: {ip}")
        
        # Check cache first
        current_time = time.time()
        cache_key = f"ip_info_{ip}"
        
        if cache_key in _ip_cache:
            cached_data, cached_time = _ip_cache[cache_key]
            if current_time - cached_time < _cache_ttl:
                logger.info(f"Returning cached IP info for {ip}")
                return cached_data
        
        # Get real IP information with optimized performance
        ip_info = await get_real_ip_info(ip)
        
        # Cache the result
        _ip_cache[cache_key] = (ip_info, current_time)
        
        # Simple cache cleanup
        if len(_ip_cache) > 100:
            _ip_cache.clear()
        
        return ip_info
            
    except Exception as e:
        logger.error(f"Failed to get IP information: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get IP information: {str(e)}")

@router.get("/my-ip")
async def get_my_ip(request: Request):
    """
    Get the client's public IP address quickly.
    """
    try:
        ip = get_client_ip(request)
        logger.info(f"Client IP detected: {ip}")
        
        # If we're in development mode (localhost), get the real public IP
        if ip == "127.0.0.1" or ip.startswith("192.168.") or ip.startswith("10."):
            logger.info("Development mode: getting real public IP")
            real_ip = await get_real_public_ip()
            if real_ip != "127.0.0.1":
                ip = real_ip
                logger.info(f"Real public IP detected: {ip}")
        
        return {"ip": ip}
        
    except Exception as e:
        logger.error(f"Failed to get IP address: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get IP address: {str(e)}")

