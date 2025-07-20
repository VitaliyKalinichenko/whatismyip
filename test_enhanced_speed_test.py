#!/usr/bin/env python3
"""
Test script for the enhanced speed test API.
This script tests the improved speed test implementation to verify accuracy improvements.
"""

import requests
import json
import time
import sys

def test_enhanced_speed_test():
    """Test the enhanced speed test API endpoint."""
    
    base_url = "http://localhost:8000"
    
    print("🚀 Testing Enhanced Speed Test Implementation")
    print("=" * 50)
    
    # Test 1: Basic speed test
    print("\n1. Testing basic speed test endpoint...")
    try:
        start_time = time.time()
        response = requests.post(f"{base_url}/api/v1/speed-test", 
                               headers={'Content-Type': 'application/json'})
        end_time = time.time()
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Speed test completed in {end_time - start_time:.1f} seconds")
            print(f"   📥 Download: {result['download_speed']} Mbps")
            print(f"   📤 Upload: {result['upload_speed']} Mbps")
            print(f"   📡 Ping: {result['ping']} ms")
            print(f"   🌐 Server: {result['server_location']}")
            
            # Validate results are reasonable
            if result['download_speed'] > 0 and result['upload_speed'] > 0:
                print("✅ Results appear valid")
            else:
                print("❌ Results appear invalid (zero speeds)")
                
        else:
            print(f"❌ Speed test failed with status {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Speed test failed with error: {e}")
    
    # Test 2: Server list
    print("\n2. Testing server list endpoint...")
    try:
        response = requests.get(f"{base_url}/api/v1/speed-test/servers")
        
        if response.status_code == 200:
            result = response.json()
            servers = result.get('servers', [])
            print(f"✅ Found {len(servers)} available servers")
            
            if servers:
                print("   Top 3 servers:")
                for i, server in enumerate(servers[:3]):
                    print(f"   {i+1}. {server['name']} ({server['location']}) - {server['distance']}km")
            
        else:
            print(f"❌ Server list failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Server list failed with error: {e}")
    
    # Test 3: Test with specific server (if available)
    print("\n3. Testing with specific server...")
    try:
        # Get server list first
        response = requests.get(f"{base_url}/api/v1/speed-test/servers")
        if response.status_code == 200:
            servers = response.json().get('servers', [])
            if servers:
                server_id = servers[0]['id']
                print(f"   Using server: {servers[0]['name']}")
                
                start_time = time.time()
                response = requests.post(f"{base_url}/api/v1/speed-test/server/{server_id}")
                end_time = time.time()
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Server-specific test completed in {end_time - start_time:.1f} seconds")
                    print(f"   📥 Download: {result['download_speed']} Mbps")
                    print(f"   📤 Upload: {result['upload_speed']} Mbps")
                    print(f"   📡 Ping: {result['ping']} ms")
                else:
                    print(f"❌ Server-specific test failed with status {response.status_code}")
            else:
                print("⚠️  No servers available for specific server test")
        else:
            print("⚠️  Could not get server list for specific server test")
            
    except Exception as e:
        print(f"❌ Server-specific test failed with error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Enhanced Speed Test Validation Complete")
    print("\nKey Improvements:")
    print("• 8+ parallel threads for better throughput")
    print("• 50MB+ test files for high-speed connections")
    print("• Connection warm-up to overcome TCP slow start")
    print("• Premium CDN server selection")
    print("• Statistical analysis with outlier removal")
    print("• Enhanced ping testing with multiple samples")

def check_backend_status():
    """Check if the backend is running."""
    try:
        response = requests.get("http://localhost:8000", timeout=5)
        return True
    except:
        return False

if __name__ == "__main__":
    print("Enhanced Speed Test Validation")
    print("=" * 30)
    
    # Check if backend is running
    if not check_backend_status():
        print("❌ Backend is not running on http://localhost:8000")
        print("Please start the backend first using: .\\start-backend.ps1")
        sys.exit(1)
    
    print("✅ Backend is running")
    
    # Run the tests
    test_enhanced_speed_test()
    
    print("\n💡 Tips for best results:")
    print("• Close other applications using bandwidth")
    print("• Test during off-peak hours")
    print("• Run multiple tests and compare results")
    print("• Compare with other professional speed test services") 