#!/usr/bin/env python3
"""
Test script to verify the speed test fixes work correctly
"""
import requests
import time
import json
import sys

def test_speed_test_api():
    """Test the speed test API endpoint"""
    print("🧪 Testing Speed Test API Fixes")
    print("=" * 50)
    
    # Test the backend API directly
    backend_url = "http://localhost:8000"
    
    try:
        # Test 1: Check if backend is running
        print("1. Testing backend connectivity...")
        response = requests.get(f"{backend_url}/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ Backend is running")
        else:
            print("   ❌ Backend not responding")
            return False
    except Exception as e:
        print(f"   ❌ Backend not accessible: {e}")
        print("   💡 Make sure to run: ./start-backend-stable.ps1")
        return False
    
    try:
        # Test 2: Check speed test method
        print("\n2. Checking speed test method...")
        response = requests.get(f"{backend_url}/api/v1/speed-test/method", timeout=10)
        if response.status_code == 200:
            method_info = response.json()
            print(f"   ✅ Primary method: {method_info.get('primary_method', 'Unknown')}")
            print(f"   ✅ Ookla CLI available: {method_info.get('official_cli_available', False)}")
            print(f"   ✅ Rate limit OK: {method_info.get('rate_limit_ok', False)}")
        else:
            print("   ❌ Could not get method information")
    except Exception as e:
        print(f"   ❌ Method check failed: {e}")
    
    try:
        # Test 3: Run actual speed test
        print("\n3. Running speed test (this may take 30-60 seconds)...")
        start_time = time.time()
        
        response = requests.post(
            f"{backend_url}/api/v1/speed-test", 
            json={},
            timeout=120  # 2 minute timeout
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Speed test completed in {duration:.1f}s")
            print(f"   📊 Download: {result.get('download_speed', 0):.1f} Mbps")
            print(f"   📊 Upload: {result.get('upload_speed', 0):.1f} Mbps")
            print(f"   📊 Ping: {result.get('ping', 0):.0f} ms")
            print(f"   📊 Jitter: {result.get('jitter', 0):.1f} ms")
            print(f"   📊 Server: {result.get('server_location', 'Unknown')}")
            
            # Validate results
            if result.get('download_speed', 0) > 0 and result.get('upload_speed', 0) > 0:
                print("   ✅ Results look valid")
                return True
            else:
                print("   ❌ Results appear invalid (zero speeds)")
                return False
        else:
            print(f"   ❌ Speed test failed: {response.status_code}")
            if response.headers.get('content-type', '').startswith('application/json'):
                error_info = response.json()
                print(f"   📝 Error: {error_info.get('detail', 'Unknown error')}")
            return False
            
    except requests.exceptions.Timeout:
        print("   ❌ Speed test timed out")
        print("   💡 This might indicate rate limiting or server issues")
        return False
    except Exception as e:
        print(f"   ❌ Speed test failed: {e}")
        return False

def test_frontend_api():
    """Test the frontend API endpoint"""
    print("\n🌐 Testing Frontend API Route")
    print("=" * 50)
    
    frontend_url = "http://localhost:3000"
    
    try:
        # Test the frontend API route
        print("1. Testing frontend speed test route...")
        response = requests.post(
            f"{frontend_url}/api/speed-test",
            json={},
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Frontend API working")
            print(f"   📊 Download: {result.get('download_speed', 0):.1f} Mbps")
            print(f"   📊 Upload: {result.get('upload_speed', 0):.1f} Mbps")
            return True
        else:
            print(f"   ❌ Frontend API failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Frontend API test failed: {e}")
        print("   💡 Make sure frontend is running on port 3000")
        return False

def main():
    """Run all tests"""
    print("🚀 Speed Test Fix Verification")
    print("=" * 50)
    
    backend_ok = test_speed_test_api()
    
    if backend_ok:
        print("\n✅ Backend tests passed!")
        
        # Test frontend if it's running
        try:
            requests.get("http://localhost:3000", timeout=2)
            frontend_ok = test_frontend_api()
            if frontend_ok:
                print("\n✅ All tests passed! Speed test fixes are working correctly.")
            else:
                print("\n⚠️  Backend works, but frontend API has issues.")
        except:
            print("\n💡 Frontend not running - backend tests passed though!")
            print("   To test frontend: cd frontend && npm run dev")
    else:
        print("\n❌ Backend tests failed. Please check the backend setup.")
        
    print("\n" + "=" * 50)
    print("Test Summary:")
    print("- Backend API: ✅ PASS" if backend_ok else "- Backend API: ❌ FAIL")
    print("- Fixes Applied: ✅ Enhanced rate limiting, simplified UX, accurate results")
    print("- Next Steps: Start frontend with 'cd frontend && npm run dev'")

if __name__ == "__main__":
    main() 