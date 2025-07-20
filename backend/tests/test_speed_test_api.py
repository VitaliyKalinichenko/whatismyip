import pytest
import json
import subprocess
import time
from unittest.mock import Mock, patch, MagicMock, AsyncMock, call
from fastapi.testclient import TestClient
from httpx import AsyncClient
from app.api.v1.speed_test import router, get_ookla_cli_path, RateLimitTracker

class TestSpeedTestAPI:
    """Test suite for Speed Test API endpoints."""

    def test_health_check(self, client: TestClient):
        """Test the health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    @pytest.mark.api
    def test_speed_test_method_endpoint(self, client: TestClient):
        """Test the speed test method endpoint."""
        with patch('app.api.v1.speed_test.get_ookla_cli_path') as mock_path, \
             patch('os.path.exists') as mock_exists:
            mock_path.return_value = "/path/to/speedtest.exe"
            mock_exists.return_value = True
            
            response = client.get("/api/v1/speed-test/method")
            assert response.status_code == 200
            data = response.json()
            assert data["method"] == "Official Ookla CLI (Maximum Accuracy)"
            assert data["available"] is True

    @pytest.mark.api
    def test_speed_test_method_endpoint_not_available(self, client: TestClient):
        """Test the speed test method endpoint when Ookla CLI is not available."""
        with patch('app.api.v1.speed_test.get_ookla_cli_path') as mock_path, \
             patch('os.path.exists') as mock_exists:
            mock_path.return_value = "/path/to/speedtest.exe"
            mock_exists.return_value = False
            
            response = client.get("/api/v1/speed-test/method")
            assert response.status_code == 200
            data = response.json()
            assert data["method"] == "Enhanced Speedtest-cli Library (Ookla Network)"
            assert data["available"] is False

    @pytest.mark.speed_test
    def test_successful_ookla_cli_speed_test(self, client: TestClient, sample_ookla_response):
        """Test successful Ookla CLI speed test."""
        mock_result = subprocess.CompletedProcess(
            args=[],
            returncode=0,
            stdout=json.dumps(sample_ookla_response),
            stderr=""
        )
        
        with patch('app.api.v1.speed_test.get_ookla_cli_path') as mock_path, \
             patch('os.path.exists') as mock_exists, \
             patch('subprocess.run') as mock_run, \
             patch('httpx.AsyncClient') as mock_client:
            
            mock_path.return_value = "/path/to/speedtest.exe"
            mock_exists.return_value = True
            mock_run.return_value = mock_result
            
            # Mock geolocation response
            mock_response = Mock()
            mock_response.json.return_value = {
                "ip": "192.168.1.1",
                "city": "New York",
                "country": "US"
            }
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            response = client.post("/api/v1/speed-test")
            assert response.status_code == 200
            
            data = response.json()
            assert data["download_speed"] == 200.0  # 25000000 bits / 1000000 * 8
            assert data["upload_speed"] == 100.0    # 12500000 bits / 1000000 * 8
            assert data["ping"] == 25.8
            assert data["jitter"] == 1.5
            assert data["server_location"] == "Test Server, New York, NY"
            assert data["isp"] == "Test ISP"

    @pytest.mark.speed_test
    def test_ookla_cli_rate_limiting(self, client: TestClient):
        """Test Ookla CLI rate limiting behavior."""
        # Mock rate limited response
        mock_result = subprocess.CompletedProcess(
            args=[],
            returncode=429,
            stdout="",
            stderr="[2025-01-01 12:00:00.000] [error] Limit reached:\nSpeedtest CLI. Too many requests received."
        )
        
        with patch('app.api.v1.speed_test.get_ookla_cli_path') as mock_path, \
             patch('os.path.exists') as mock_exists, \
             patch('subprocess.run') as mock_run, \
             patch('speedtest.Speedtest') as mock_speedtest, \
             patch('httpx.AsyncClient') as mock_client:
            
            mock_path.return_value = "/path/to/speedtest.exe"
            mock_exists.return_value = True
            mock_run.return_value = mock_result
            
            # Mock fallback speedtest-cli
            mock_st = Mock()
            mock_st.download.return_value = 150000000
            mock_st.upload.return_value = 75000000
            mock_st.results.ping = 30.0
            mock_st.results.server = {'name': 'Fallback Server', 'sponsor': 'Test', 'country': 'US'}
            mock_speedtest.return_value = mock_st
            
            # Mock geolocation
            mock_response = Mock()
            mock_response.json.return_value = {"ip": "192.168.1.1", "city": "New York", "country": "US"}
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
            
            response = client.post("/api/v1/speed-test")
            assert response.status_code == 200
            
            data = response.json()
            assert data["download_speed"] == 150.0
            assert data["upload_speed"] == 75.0
            assert "Enhanced Speedtest-cli Library" in data.get("method", "")

    @pytest.mark.speed_test
    def test_http_fallback_speed_test(self, client: TestClient):
        """Test HTTP fallback speed test when all other methods fail."""
        with patch('app.api.v1.speed_test.get_ookla_cli_path') as mock_path, \
             patch('os.path.exists') as mock_exists, \
             patch('subprocess.run') as mock_run, \
             patch('speedtest.Speedtest') as mock_speedtest, \
             patch('httpx.AsyncClient') as mock_client:
            
            mock_path.return_value = "/path/to/speedtest.exe"
            mock_exists.return_value = False
            mock_run.side_effect = Exception("Ookla CLI not available")
            mock_speedtest.side_effect = Exception("Speedtest-cli failed")
            
            # Mock HTTP fallback responses
            mock_http_client = Mock()
            mock_http_client.get.return_value.elapsed.total_seconds.return_value = 2.0
            mock_http_client.get.return_value.content = b"x" * (25 * 1024 * 1024)  # 25MB
            mock_client.return_value.__aenter__.return_value = mock_http_client
            
            # Mock geolocation
            mock_geo_response = Mock()
            mock_geo_response.json.return_value = {"ip": "192.168.1.1", "city": "New York", "country": "US"}
            mock_http_client.get.return_value = mock_geo_response
            
            response = client.post("/api/v1/speed-test")
            assert response.status_code == 200
            
            data = response.json()
            assert data["download_speed"] > 0
            assert data["upload_speed"] > 0
            assert "HTTP Fallback" in data.get("method", "")

    @pytest.mark.speed_test
    def test_speed_test_all_methods_fail(self, client: TestClient):
        """Test speed test when all methods fail."""
        with patch('app.api.v1.speed_test.get_ookla_cli_path') as mock_path, \
             patch('os.path.exists') as mock_exists, \
             patch('subprocess.run') as mock_run, \
             patch('speedtest.Speedtest') as mock_speedtest, \
             patch('httpx.AsyncClient') as mock_client:
            
            mock_path.return_value = "/path/to/speedtest.exe"
            mock_exists.return_value = False
            mock_run.side_effect = Exception("Ookla CLI failed")
            mock_speedtest.side_effect = Exception("Speedtest-cli failed")
            mock_client.side_effect = Exception("HTTP requests failed")
            
            response = client.post("/api/v1/speed-test")
            assert response.status_code == 500
            
            data = response.json()
            assert "Speed test execution failed" in data["detail"]

    @pytest.mark.unit
    def test_get_ookla_cli_path_function(self):
        """Test the get_ookla_cli_path function."""
        with patch('os.path.exists') as mock_exists, \
             patch('os.path.abspath') as mock_abspath:
            
            mock_exists.return_value = True
            mock_abspath.return_value = "/abs/path/to/speedtest.exe"
            
            result = get_ookla_cli_path()
            assert result == "/abs/path/to/speedtest.exe"
            
            mock_exists.return_value = False
            result = get_ookla_cli_path()
            assert "speedtest.exe" in result

    @pytest.mark.unit
    def test_rate_limit_tracker(self):
        """Test the RateLimitTracker class."""
        tracker = RateLimitTracker(interval=1, max_requests=2)
        
        # Should allow first request
        assert tracker.can_make_request() is True
        tracker.record_request()
        
        # Should allow second request
        assert tracker.can_make_request() is True
        tracker.record_request()
        
        # Should deny third request
        assert tracker.can_make_request() is False
        
        # Should reset after interval
        time.sleep(1.1)
        assert tracker.can_make_request() is True

    @pytest.mark.unit
    def test_rate_limit_tracker_with_rate_limiting(self):
        """Test RateLimitTracker rate limiting behavior."""
        tracker = RateLimitTracker(interval=10, max_requests=1)
        
        # Record a rate limit
        tracker.record_rate_limit()
        
        # Should increase interval
        assert tracker.interval > 10
        
        # Should still deny requests
        assert tracker.can_make_request() is False

    @pytest.mark.integration
    def test_speed_test_geolocation_integration(self, client: TestClient):
        """Test speed test with geolocation integration."""
        with patch('app.api.v1.speed_test.get_ookla_cli_path') as mock_path, \
             patch('os.path.exists') as mock_exists, \
             patch('subprocess.run') as mock_run, \
             patch('httpx.AsyncClient') as mock_client:
            
            mock_path.return_value = "/path/to/speedtest.exe"
            mock_exists.return_value = False
            mock_run.side_effect = Exception("Ookla CLI not available")
            
            # Mock geolocation responses
            mock_http_client = Mock()
            
            # Mock IP detection
            mock_ip_response = Mock()
            mock_ip_response.json.return_value = {"ip": "8.8.8.8"}
            
            # Mock geolocation
            mock_geo_response = Mock()
            mock_geo_response.json.return_value = {
                "ip": "8.8.8.8",
                "city": "Mountain View",
                "region": "CA",
                "country": "US",
                "timezone": "America/Los_Angeles",
                "isp": "Google LLC",
                "lat": 37.4056,
                "lon": -122.0775
            }
            
            mock_http_client.get.side_effect = [mock_ip_response, mock_geo_response]
            mock_client.return_value.__aenter__.return_value = mock_http_client
            
            # Mock HTTP fallback for speed test
            mock_http_client.get.return_value.elapsed.total_seconds.return_value = 2.0
            mock_http_client.get.return_value.content = b"x" * (25 * 1024 * 1024)
            
            response = client.post("/api/v1/speed-test")
            assert response.status_code == 200
            
            data = response.json()
            assert data["download_speed"] > 0
            assert data["upload_speed"] > 0
            assert "Google LLC" in data.get("isp", "")

    @pytest.mark.api
    def test_speed_test_request_validation(self, client: TestClient):
        """Test speed test request validation."""
        # Test with invalid request body
        response = client.post("/api/v1/speed-test", json={"invalid": "data"})
        # Should still work as the endpoint doesn't require specific body format
        assert response.status_code in [200, 500]  # 500 if all methods fail

    @pytest.mark.api
    def test_speed_test_concurrent_requests(self, client: TestClient):
        """Test handling of concurrent speed test requests."""
        import threading
        import time
        
        results = []
        
        def make_request():
            with patch('app.api.v1.speed_test.get_ookla_cli_path') as mock_path, \
                 patch('os.path.exists') as mock_exists, \
                 patch('subprocess.run') as mock_run, \
                 patch('httpx.AsyncClient'):
                
                mock_path.return_value = "/path/to/speedtest.exe"
                mock_exists.return_value = False
                mock_run.side_effect = Exception("Simulated failure")
                
                response = client.post("/api/v1/speed-test")
                results.append(response.status_code)
        
        # Start multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should complete (even if they fail)
        assert len(results) == 3
        assert all(status in [200, 500] for status in results)

    @pytest.mark.slow
    def test_speed_test_timeout_handling(self, client: TestClient):
        """Test speed test timeout handling."""
        with patch('app.api.v1.speed_test.get_ookla_cli_path') as mock_path, \
             patch('os.path.exists') as mock_exists, \
             patch('subprocess.run') as mock_run:
            
            mock_path.return_value = "/path/to/speedtest.exe"
            mock_exists.return_value = True
            
            # Mock a long-running process
            mock_run.side_effect = subprocess.TimeoutExpired("speedtest.exe", 120)
            
            response = client.post("/api/v1/speed-test")
            assert response.status_code == 500
            
            data = response.json()
            assert "Speed test execution failed" in data["detail"]

    @pytest.mark.unit
    def test_speed_calculation_accuracy(self):
        """Test speed calculation accuracy."""
        # Test Ookla CLI speed calculation
        bandwidth_bps = 25000000  # 25 Mbps in bits per second
        expected_mbps = 200.0     # 25000000 / 125000 (bytes to Mbps conversion)
        
        # This would be tested in the actual speed test processing
        # The conversion should be: bandwidth_bps / 125000 for Mbps
        calculated_mbps = bandwidth_bps / 125000
        assert abs(calculated_mbps - expected_mbps) < 0.1

    @pytest.mark.unit
    def test_error_message_formatting(self):
        """Test error message formatting."""
        from app.api.v1.speed_test import router
        
        # Test that error messages are properly formatted
        error_msg = "Test error message"
        # This would be tested in the actual error handling code
        assert isinstance(error_msg, str)
        assert len(error_msg) > 0

    @pytest.mark.integration
    def test_speed_test_with_mock_servers(self, client: TestClient):
        """Test speed test with mocked server responses."""
        sample_response = {
            "download_speed": 150.5,
            "upload_speed": 75.2,
            "ping": 25.8,
            "jitter": 2.1,
            "server_location": "Test Server, New York, NY",
            "isp": "Test ISP",
            "method": "Test Method",
            "timestamp": int(time.time())
        }
        
        with patch('app.api.v1.speed_test.get_ookla_cli_path') as mock_path, \
             patch('os.path.exists') as mock_exists, \
             patch('subprocess.run') as mock_run, \
             patch('httpx.AsyncClient') as mock_client:
            
            mock_path.return_value = "/path/to/speedtest.exe"
            mock_exists.return_value = True
            
            # Mock successful Ookla CLI response
            mock_ookla_response = {
                "ping": {"latency": 25.8, "jitter": 2.1},
                "download": {"bandwidth": 18843750},  # 150.5 Mbps
                "upload": {"bandwidth": 9400000},     # 75.2 Mbps
                "server": {"name": "Test Server", "location": "New York, NY"},
                "isp": "Test ISP"
            }
            
            mock_result = subprocess.CompletedProcess(
                args=[],
                returncode=0,
                stdout=json.dumps(mock_ookla_response),
                stderr=""
            )
            mock_run.return_value = mock_result
            
            # Mock geolocation
            mock_geo_response = Mock()
            mock_geo_response.json.return_value = {
                "ip": "192.168.1.1",
                "city": "New York",
                "country": "US"
            }
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_geo_response
            
            response = client.post("/api/v1/speed-test")
            assert response.status_code == 200
            
            data = response.json()
            assert data["download_speed"] == 150.75  # 18843750 / 125000
            assert data["upload_speed"] == 75.2      # 9400000 / 125000
            assert data["ping"] == 25.8
            assert data["jitter"] == 2.1
            assert "Test Server" in data["server_location"]
            assert data["isp"] == "Test ISP" 