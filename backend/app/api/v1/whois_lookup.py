from fastapi import APIRouter, HTTPException, Query
from app.models.ip_models import WhoisInfo
import re
import logging
import whois
from datetime import datetime
from typing import Optional, List

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.get("/whois", response_model=WhoisInfo)
async def whois_lookup(domain: str = Query(..., description="Domain name to lookup")):
    """
    Perform real WHOIS lookup for a domain.
    """
    try:
        # Validate domain
        if not is_valid_domain(domain):
            raise HTTPException(status_code=400, detail="Invalid domain name")
        
        logger.info(f"Performing WHOIS lookup for {domain}")
        
        # Perform real WHOIS lookup
        whois_info = await perform_whois_query(domain)
        
        return whois_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WHOIS lookup failed for {domain}: {e}")
        raise HTTPException(status_code=500, detail=f"WHOIS lookup failed: {str(e)}")

async def perform_whois_query(domain: str) -> WhoisInfo:
    """
    Perform real WHOIS lookup using python-whois library.
    """
    try:
        logger.info(f"Querying WHOIS data for {domain}")
        
        # Perform WHOIS query
        domain_info = whois.whois(domain)
        
        # Extract and normalize data
        registrar = extract_registrar(domain_info)
        creation_date = extract_date(domain_info.creation_date)
        expiration_date = extract_date(domain_info.expiration_date)
        name_servers = extract_name_servers(domain_info.name_servers)
        status = extract_status(domain_info.status)
        
        logger.info(f"WHOIS lookup successful for {domain}")
        
        return WhoisInfo(
            domain=domain,
            registrar=registrar or "Unknown",
            creation_date=creation_date,
            expiration_date=expiration_date,
            name_servers=name_servers,
            status=status
        )
        
    except Exception as e:
        logger.error(f"WHOIS query failed for {domain}: {e}")
        
        # Return minimal info if WHOIS fails
        return WhoisInfo(
            domain=domain,
            registrar="Unknown",
            creation_date=None,
            expiration_date=None,
            name_servers=[],
            status=["Query failed"]
        )

def extract_registrar(domain_info) -> Optional[str]:
    """Extract registrar information from WHOIS data."""
    try:
        if hasattr(domain_info, 'registrar') and domain_info.registrar:
            if isinstance(domain_info.registrar, list):
                return domain_info.registrar[0] if domain_info.registrar else None
            return str(domain_info.registrar)
    except:
        pass
    return None

def extract_date(date_value) -> Optional[datetime]:
    """Extract and normalize date from WHOIS data."""
    try:
        if date_value:
            if isinstance(date_value, list):
                date_value = date_value[0] if date_value else None
            
            if isinstance(date_value, datetime):
                return date_value
            elif isinstance(date_value, str):
                # Try to parse string dates
                from dateutil import parser
                return parser.parse(date_value)
    except:
        pass
    return None

def extract_name_servers(name_servers) -> List[str]:
    """Extract name servers from WHOIS data."""
    try:
        if name_servers:
            if isinstance(name_servers, list):
                return [str(ns).lower() for ns in name_servers if ns]
            elif isinstance(name_servers, str):
                return [name_servers.lower()]
    except:
        pass
    return []

def extract_status(status) -> List[str]:
    """Extract status information from WHOIS data."""
    try:
        if status:
            if isinstance(status, list):
                return [str(s) for s in status if s]
            elif isinstance(status, str):
                return [status]
    except:
        pass
    return []

def is_valid_domain(domain: str) -> bool:
    """
    Validate domain name format.
    """
    if not domain or len(domain) > 253:
        return False
    
    # Basic domain validation
    pattern = r'^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
    return bool(re.match(pattern, domain))

@router.get("/domain-available")
async def check_domain_availability(domain: str = Query(..., description="Domain name to check")):
    """
    Check if a domain is available for registration by analyzing WHOIS data.
    """
    try:
        if not is_valid_domain(domain):
            raise HTTPException(status_code=400, detail="Invalid domain name")
        
        logger.info(f"Checking availability for domain: {domain}")
        
        try:
            # Try to get WHOIS data
            domain_info = whois.whois(domain)
            
            # If we get valid registration data, domain is likely registered
            if (domain_info.registrar or 
                domain_info.creation_date or 
                domain_info.expiration_date or
                domain_info.name_servers):
                
                # Check if domain is expired
                expired = False
                if domain_info.expiration_date:
                    exp_date = extract_date(domain_info.expiration_date)
                    if exp_date and exp_date < datetime.now():
                        expired = True
                
                return {
                    "domain": domain,
                    "available": expired,
                    "status": "expired" if expired else "registered",
                    "registrar": extract_registrar(domain_info),
                    "expiration_date": extract_date(domain_info.expiration_date)
                }
            else:
                # No registration data found
                return {
                    "domain": domain,
                    "available": True,
                    "status": "available"
                }
                
        except Exception as e:
            # If WHOIS query fails, domain might be available
            logger.info(f"WHOIS query failed for {domain}, might be available: {e}")
            return {
                "domain": domain,
                "available": True,
                "status": "likely_available",
                "note": "WHOIS query failed, domain might be available"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Domain availability check failed for {domain}: {e}")
        raise HTTPException(status_code=500, detail=f"Domain availability check failed: {str(e)}")

@router.get("/bulk-whois")
async def bulk_whois_lookup(
    domains: str = Query(..., description="Comma-separated list of domains to lookup")
):
    """
    Perform WHOIS lookup for multiple domains.
    
    Limited to 10 domains per request to prevent abuse.
    """
    try:
        # Parse domains
        domain_list = [d.strip() for d in domains.split(",") if d.strip()]
        
        if len(domain_list) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 domains per request")
        
        logger.info(f"Performing bulk WHOIS lookup for {len(domain_list)} domains")
        
        results = []
        for domain in domain_list:
            try:
                if is_valid_domain(domain):
                    whois_data = await perform_whois_query(domain)
                    results.append({
                        "domain": domain,
                        "status": "success",
                        "data": whois_data.dict()
                    })
                else:
                    results.append({
                        "domain": domain,
                        "status": "error",
                        "error": "Invalid domain name"
                    })
            except Exception as e:
                logger.warning(f"WHOIS lookup failed for {domain}: {e}")
                results.append({
                    "domain": domain,
                    "status": "error",
                    "error": str(e)
                })
        
        successful_lookups = len([r for r in results if r["status"] == "success"])
        logger.info(f"Bulk WHOIS completed: {successful_lookups}/{len(domain_list)} successful")
        
        return {
            "results": results,
            "total_domains": len(domain_list),
            "successful_lookups": successful_lookups
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk WHOIS lookup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Bulk WHOIS lookup failed: {str(e)}")

@router.get("/domain-history")
async def get_domain_history(domain: str = Query(..., description="Domain to get history for")):
    """
    Get domain registration history and key dates.
    """
    try:
        if not is_valid_domain(domain):
            raise HTTPException(status_code=400, detail="Invalid domain name")
        
        logger.info(f"Getting domain history for {domain}")
        
        # Get WHOIS data
        whois_data = await perform_whois_query(domain)
        
        # Calculate domain age and other metrics
        domain_age_days = None
        days_until_expiry = None
        
        if whois_data.creation_date:
            domain_age_days = (datetime.now() - whois_data.creation_date).days
        
        if whois_data.expiration_date:
            days_until_expiry = (whois_data.expiration_date - datetime.now()).days
        
        return {
            "domain": domain,
            "creation_date": whois_data.creation_date,
            "expiration_date": whois_data.expiration_date,
            "registrar": whois_data.registrar,
            "domain_age_days": domain_age_days,
            "days_until_expiry": days_until_expiry,
            "name_servers": whois_data.name_servers,
            "status": whois_data.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Domain history lookup failed for {domain}: {e}")
        raise HTTPException(status_code=500, detail=f"Domain history lookup failed: {str(e)}")

