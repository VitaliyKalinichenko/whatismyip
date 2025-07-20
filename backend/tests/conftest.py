import pytest
import asyncio
import os
import sys
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from httpx import AsyncClient
from typing import AsyncGenerator, Generator

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.main import app

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client for FastAPI app."""
    with TestClient(app) as client:
        yield client

@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for FastAPI app."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def mock_subprocess():
    """Mock subprocess for Ookla CLI tests."""
    with patch('subprocess.run') as mock_run:
        yield mock_run

@pytest.fixture
def mock_httpx():
    """Mock httpx for HTTP requests."""
    with patch('httpx.AsyncClient') as mock_client:
        yield mock_client

@pytest.fixture
def mock_speedtest_cli():
    """Mock speedtest-cli library."""
    with patch('speedtest.Speedtest') as mock_speedtest:
        yield mock_speedtest

@pytest.fixture
def sample_ookla_response():
    """Sample Ookla CLI JSON response."""
    return {
        "type": "result",
        "timestamp": "2024-01-01T12:00:00Z",
        "ping": {
            "jitter": 1.5,
            "latency": 25.8,
            "low": 24.2,
            "high": 27.1
        },
        "download": {
            "bandwidth": 25000000,
            "bytes": 300000000,
            "elapsed": 12000
        },
        "upload": {
            "bandwidth": 12500000,
            "bytes": 150000000,
            "elapsed": 12000
        },
        "server": {
            "id": 12345,
            "name": "Test Server",
            "location": "New York, NY",
            "country": "US"
        },
        "isp": "Test ISP"
    }

@pytest.fixture
def sample_speedtest_cli_response():
    """Sample speedtest-cli library response."""
    mock_st = Mock()
    mock_st.download.return_value = 200000000  # 200 Mbps in bits
    mock_st.upload.return_value = 100000000    # 100 Mbps in bits
    mock_st.results.ping = 30.5
    mock_st.results.server = {
        'name': 'Test Server',
        'sponsor': 'Test Sponsor',
        'country': 'US'
    }
    return mock_st

@pytest.fixture
def sample_http_response():
    """Sample HTTP fallback response."""
    return {
        "download_speed": 150.0,
        "upload_speed": 75.0,
        "ping": 25.0,
        "method": "HTTP Fallback"
    }

@pytest.fixture
def mock_geolocation():
    """Mock geolocation response."""
    return {
        "ip": "192.168.1.1",
        "city": "New York",
        "region": "NY",
        "country": "US",
        "timezone": "America/New_York",
        "isp": "Test ISP",
        "lat": 40.7128,
        "lon": -74.0060
    }

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Set up test environment variables."""
    os.environ['TESTING'] = 'true'
    os.environ['DISABLE_RELOAD'] = 'true'
    yield
    # Cleanup
    if 'TESTING' in os.environ:
        del os.environ['TESTING']
    if 'DISABLE_RELOAD' in os.environ:
        del os.environ['DISABLE_RELOAD']

@pytest.fixture
def mock_file_system():
    """Mock file system operations."""
    with patch('os.path.exists'), \
         patch('os.path.abspath'), \
         patch('tempfile.mkdtemp'), \
         patch('shutil.rmtree'):
        yield

@pytest.fixture
def mock_network_calls():
    """Mock all network calls."""
    with patch('httpx.AsyncClient') as mock_client, \
         patch('requests.get') as mock_requests:
        yield mock_client, mock_requests 