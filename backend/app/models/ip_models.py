from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class IPInfo(BaseModel):
    ip: str
    city: str
    region: str
    country: str
    country_code: str
    isp: str
    timezone: str
    currency: Optional[str] = None
    calling_code: Optional[str] = None
    flag: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class DNSRecord(BaseModel):
    type: str
    name: str
    value: str
    ttl: Optional[int] = None

class DNSResponse(BaseModel):
    domain: str
    records: List[DNSRecord]
    query_time: Optional[float] = None  # Time in milliseconds

class PortStatus(BaseModel):
    port: int
    status: str  # "open", "closed", "filtered", "error"
    service: Optional[str] = None

class PortCheckRequest(BaseModel):
    host: str
    ports: List[int]

class PortCheckResponse(BaseModel):
    host: str
    ports: List[PortStatus]
    scan_time: float

# New models for port checker to match frontend expectations
class PortCheckResult(BaseModel):
    host: str
    port: int
    is_open: bool
    service: Optional[str] = None
    response_time: Optional[float] = None

class PortCheckResultResponse(BaseModel):
    results: List[PortCheckResult]

class WhoisInfo(BaseModel):
    domain: str
    registrar: Optional[str] = None
    creation_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None
    status: List[str] = []
    name_servers: List[str] = []
    registrant_org: Optional[str] = None
    registrant_country: Optional[str] = None
    admin_email: Optional[str] = None
    raw_data: Optional[str] = None

class BlacklistDetail(BaseModel):
    listed: bool
    response_time: float
    error: Optional[str] = None

class BlacklistResult(BaseModel):
    ip: str
    is_blacklisted: bool
    total_lists: int
    blacklisted_on: List[str]
    clean_on: List[str]
    details: Dict[str, BlacklistDetail]

# Additional models for blacklist API endpoints
class BlacklistCheck(BaseModel):
    ip: str
    blacklists: Optional[List[str]] = None

class BlacklistItem(BaseModel):
    blacklist: str
    listed: bool
    details: str

class BlacklistResponse(BaseModel):
    ip: str
    results: List[BlacklistItem]
    total_checked: int
    listed_count: int
    # Frontend compatibility fields
    is_blacklisted: Optional[bool] = None
    total_lists: Optional[int] = None
    blacklisted_on: Optional[List[str]] = None
    clean_on: Optional[List[str]] = None
    details: Optional[Dict[str, Dict[str, Any]]] = None

class SpeedTestResult(BaseModel):
    download_speed: float  # Mbps
    upload_speed: float    # Mbps
    ping: float           # ms
    jitter: float         # ms
    server_location: str
    isp: Optional[str] = None
    method: Optional[str] = None
    test_duration: Optional[float] = None
    timestamp: Optional[float] = None

class PingTestRequest(BaseModel):
    host: str
    count: int = Field(4, ge=1, le=20)

class PingTestResult(BaseModel):
    host: str
    target_ip: str        # Resolved IP address
    packets_sent: int
    packets_received: int
    packet_loss: float
    min_time: float
    max_time: float
    avg_time: float
    timestamps: List[str]
    success: bool = True

class TracerouteHop(BaseModel):
    hop_number: int
    ip_address: Optional[str] = None
    hostname: Optional[str] = None
    response_time: Optional[float] = None
    status: str  # "success", "timeout", "error"

class TracerouteResponse(BaseModel):
    target: str
    hops: List[TracerouteHop]
    total_hops: int
    successful_hops: int
    failed_hops: int
    total_time: float
    success: bool = True

