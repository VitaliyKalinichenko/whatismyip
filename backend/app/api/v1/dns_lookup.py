from fastapi import APIRouter, HTTPException, Query
from app.models.ip_models import DNSResponse, DNSRecord
import time
import logging
import dns.resolver
import dns.exception
from typing import List, Optional

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify API connectivity"""
    return {"status": "ok", "message": "DNS lookup API is working"}

@router.get("/dns-lookup", response_model=DNSResponse)
async def dns_lookup(
    domain: str = Query(..., description="Domain name to lookup"),
    record_types: Optional[str] = Query("A", description="DNS record types to query (comma-separated: A,AAAA,MX,TXT,NS,CNAME)")
):
    """
    Perform real DNS lookup for the specified domain and record types.
    """
    try:
        # Validate domain
        if not is_valid_domain(domain):
            raise HTTPException(status_code=400, detail="Invalid domain name")
        
        # Parse record types (handle both single values and comma-separated)
        if isinstance(record_types, str):
            record_types_list = [rt.strip().upper() for rt in record_types.split(',') if rt.strip()]
        else:
            record_types_list = [record_types] if record_types else ["A"]
        
        # Validate record types
        valid_types = {"A", "AAAA", "MX", "TXT", "NS", "CNAME", "PTR", "SOA", "SRV"}
        invalid_types = [rt for rt in record_types_list if rt.upper() not in valid_types]
        if invalid_types:
            raise HTTPException(status_code=400, detail=f"Invalid record types: {', '.join(invalid_types)}")
        
        logger.info(f"Performing DNS lookup for {domain} with record types: {record_types_list}")
        start_time = time.time()
        
        records = []
        
        # Perform real DNS queries
        for record_type in record_types_list:
            try:
                logger.info(f"Querying {record_type} records for {domain}")
                dns_records = await perform_dns_query(domain, record_type.upper())
                records.extend(dns_records)
                
            except Exception as e:
                logger.warning(f"Failed to query {record_type} records for {domain}: {e}")
                # Continue with other record types if one fails
                continue
        
        query_time = round((time.time() - start_time) * 1000, 2)
        logger.info(f"DNS lookup completed for {domain} in {query_time}ms, found {len(records)} records")
        
        return DNSResponse(
            domain=domain,
            records=records,
            query_time=query_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DNS lookup failed for {domain}: {e}")
        raise HTTPException(status_code=500, detail=f"DNS lookup failed: {str(e)}")

async def perform_dns_query(domain: str, record_type: str) -> List[DNSRecord]:
    """
    Perform real DNS query using dnspython.
    """
    try:
        # Configure resolver with timeout
        resolver = dns.resolver.Resolver()
        resolver.timeout = 5
        resolver.lifetime = 10
        
        # Perform DNS resolution
        answers = resolver.resolve(domain, record_type)
        
        records = []
        for answer in answers:
            record_value = str(answer).strip()
            
            # Format MX records properly
            if record_type == "MX":
                # MX records come as "priority target"
                record_value = record_value
            elif record_type == "TXT":
                # Remove quotes from TXT records
                record_value = record_value.strip('"')
            
            records.append(DNSRecord(
                type=record_type,
                name=domain,
                value=record_value,
                ttl=int(answers.rrset.ttl)
            ))
        
        return records
        
    except dns.resolver.NXDOMAIN:
        logger.info(f"Domain {domain} not found for {record_type} records")
        return []
    except dns.resolver.NoAnswer:
        logger.info(f"No {record_type} records found for {domain}")
        return []
    except dns.resolver.Timeout:
        logger.warning(f"DNS query timeout for {domain} {record_type}")
        raise Exception(f"DNS query timeout for {record_type} records")
    except Exception as e:
        logger.error(f"DNS query failed for {domain} {record_type}: {e}")
        raise Exception(f"DNS query failed: {str(e)}")

def is_valid_domain(domain: str) -> bool:
    """
    Validate domain name format.
    """
    if not domain or len(domain) > 253:
        return False
    
    # Basic domain validation
    import re
    pattern = r'^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
    return bool(re.match(pattern, domain))

@router.get("/reverse-dns")
async def reverse_dns_lookup(ip: str = Query(..., description="IP address for reverse DNS lookup")):
    """
    Perform real reverse DNS lookup for an IP address.
    """
    try:
        # Validate IP format
        import ipaddress
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid IP address format")
        
        logger.info(f"Performing reverse DNS lookup for {ip}")
        
        # Perform reverse DNS lookup
        resolver = dns.resolver.Resolver()
        resolver.timeout = 5
        
        # Convert IP to reverse DNS format
        reversed_ip = dns.reversename.from_address(ip)
        
        try:
            answers = resolver.resolve(reversed_ip, "PTR")
            hostname = str(answers[0]).rstrip('.')
            
            logger.info(f"Reverse DNS successful for {ip}: {hostname}")
            return {
                "ip": ip,
                "hostname": hostname,
                "status": "success"
            }
            
        except dns.resolver.NXDOMAIN:
            logger.info(f"No reverse DNS record found for {ip}")
            return {
                "ip": ip,
                "hostname": None,
                "status": "no_record",
                "error": "No reverse DNS record found"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reverse DNS lookup failed for {ip}: {e}")
        raise HTTPException(status_code=500, detail=f"Reverse DNS lookup failed: {str(e)}")

@router.get("/dns-servers")
async def get_dns_servers():
    """
    Get the currently configured DNS servers.
    """
    try:
        resolver = dns.resolver.Resolver()
        servers = [str(server) for server in resolver.nameservers]
        
        return {
            "dns_servers": servers,
            "count": len(servers)
        }
        
    except Exception as e:
        logger.error(f"Failed to get DNS servers: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get DNS servers: {str(e)}")

@router.get("/dns-trace")
async def dns_trace(domain: str = Query(..., description="Domain to trace")):
    """
    Perform DNS trace to show the resolution path.
    """
    try:
        if not is_valid_domain(domain):
            raise HTTPException(status_code=400, detail="Invalid domain name")
        
        logger.info(f"Performing DNS trace for {domain}")
        
        trace_steps = []
        resolver = dns.resolver.Resolver()
        
        # Get authoritative nameservers
        try:
            # Start from root servers and trace down
            current_domain = domain
            while current_domain:
                try:
                    ns_answers = resolver.resolve(current_domain, "NS")
                    nameservers = [str(ns) for ns in ns_answers]
                    
                    trace_steps.append({
                        "domain": current_domain,
                        "nameservers": nameservers,
                        "type": "NS"
                    })
                    
                    # Move up one level
                    parts = current_domain.split('.')
                    if len(parts) <= 2:
                        break
                    current_domain = '.'.join(parts[1:])
                    
                except dns.resolver.NXDOMAIN:
                    break
                except dns.resolver.NoAnswer:
                    break
                    
        except Exception as e:
            logger.warning(f"DNS trace incomplete for {domain}: {e}")
        
        return {
            "domain": domain,
            "trace_steps": trace_steps
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DNS trace failed for {domain}: {e}")
        raise HTTPException(status_code=500, detail=f"DNS trace failed: {str(e)}")

