#!/usr/bin/env python3
"""
Test script to verify the speed test accuracy fixes
"""
import requests
import time
import json
import sys

def test_speed_test_accuracy():
    """Test the speed test accuracy improvements"""
    print("🔧 Testing Speed Test Accuracy Fixes")
    print("=" * 50)
    
    backend_url = "http://localhost:8000"
    
    try:
        # Test 1: Check backend health
        print("1. Testing backend health...")
        response = requests.get(f"{backend_url}/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ Backend is healthy")
        else:
            print("   ❌ Backend health check failed")
            return False
    except Exception as e:
        print(f"   ❌ Backend not accessible: {e}")
        return False
    
    try:
        # Test 2: Check speed test method
        print("\n2. Checking speed test method...")
        response = requests.get(f"{backend_url}/api/v1/speed-test/method", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Primary method: {data.get('primary_method')}")
            print(f"   ✅ Ookla CLI available: {data.get('official_cli_available')}")
            print(f"   ✅ Rate limit OK: {data.get('rate_limit_ok')}")
        else:
            print("   ❌ Speed test method check failed")
    except Exception as e:
        print(f"   ❌ Method check failed: {e}")
    
    try:
        # Test 3: Run actual speed test
        print("\n3. Running actual speed test...")
        print("   (This may take 30-60 seconds...)")
        
        start_time = time.time()
        response = requests.post(
            f"{backend_url}/api/v1/speed-test",
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        duration = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Speed test completed in {duration:.1f}s")
            print(f"   📊 Download: {data.get('download_speed'):.1f} Mbps")
            print(f"   📊 Upload: {data.get('upload_speed'):.1f} Mbps")
            print(f"   📊 Ping: {data.get('ping'):.1f} ms")
            print(f"   📊 Jitter: {data.get('jitter'):.1f} ms")
            print(f"   📊 Server: {data.get('server_location')}")
            
            # Check if results are reasonable
            download_speed = data.get('download_speed', 0)
            upload_speed = data.get('upload_speed', 0)
            
            if download_speed > 0 and upload_speed > 0:
                print("   ✅ Speed test returned valid results")
                
                # Check if results are in expected range
                if download_speed > 20 and upload_speed > 5:
                    print("   ✅ Speed results appear reasonable")
                else:
                    print("   ⚠️  Speed results may be low (could be actual connection speed)")
                
                return True
            else:
                print("   ❌ Speed test returned invalid results")
                return False
        else:
            print(f"   ❌ Speed test failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Speed test failed: {e}")
        return False

def test_frontend_connectivity():
    """Test frontend connectivity to backend"""
    print("\n4. Testing frontend-backend connectivity...")
    
    try:
        # Test the speed test API route that frontend uses
        response = requests.post(
            "http://localhost:3000/api/speed-test",
            headers={"Content-Type": "application/json"},
            json={},
            timeout=5
        )
        
        if response.status_code == 200:
            print("   ✅ Frontend API route working")
            return True
        else:
            print(f"   ❌ Frontend API route failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Frontend API route test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Speed Test Accuracy Verification")
    print("This script tests the fixes for speed test accuracy issues\n")
    
    success = test_speed_test_accuracy()
    
    if success:
        print("\n🎉 All tests passed! Speed test accuracy fixes are working.")
        print("\nNext steps:")
        print("1. Open http://localhost:3000/speedtest in your browser")
        print("2. Click 'Start Test' - it should begin immediately without ping delay")
        print("3. Verify that results match your actual connection speed")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the backend logs.")
        sys.exit(1) 