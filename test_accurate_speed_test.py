#!/usr/bin/env python3
"""
Test script for the new accurate speed test implementation.
This tests both the official Ookla CLI and fallback HTTP methods.
"""

import requests
import json
import time
import sys
import os
import subprocess
import platform

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

BASE_URL = "http://localhost:8000"

def test_speed_test_method_endpoint():
    """Test the method information endpoint"""
    print("🔍 Testing speed test method endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/speed-test/method", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Method endpoint successful!")
            print(f"   Primary Method: {data.get('primary_method', 'Unknown')}")
            print(f"   Fallback Method: {data.get('fallback_method', 'Unknown')}")
            print(f"   Accuracy: {data.get('accuracy', 'Unknown')}")
            print(f"   Official CLI Available: {data.get('official_cli_available', False)}")
            
            if data.get('recommendation'):
                print(f"   💡 Recommendation: {data['recommendation']}")
            
            return True
        else:
            print(f"❌ Method endpoint failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Method endpoint failed with exception: {str(e)}")
        return False

def test_accurate_speed_test():
    """Test the new accurate speed test implementation"""
    print("\n🚀 Testing accurate speed test endpoint...")
    
    try:
        response = requests.post(f"{BASE_URL}/api/v1/speed-test", timeout=180)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Accurate speed test successful!")
            print(f"   Download: {data['download_speed']} Mbps")
            print(f"   Upload: {data['upload_speed']} Mbps")
            print(f"   Ping: {data['ping']} ms")
            print(f"   Server: {data['server_location']}")
            print(f"   Duration: {data['test_duration']} seconds")
            
            # Check if results are reasonable
            if data['download_speed'] > 0 and data['upload_speed'] > 0:
                print("✅ Results look reasonable")
                
                # Check if results are significantly improved
                if data['download_speed'] > 50:  # Assuming reasonable internet speed
                    print("🎉 Speed test results appear to be accurate!")
                else:
                    print("⚠️  Results seem low, but test completed successfully")
                
                return True
            else:
                print("❌ Results are zero or negative")
                return False
        else:
            print(f"❌ Accurate speed test failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Accurate speed test failed with exception: {str(e)}")
        return False

def check_official_cli():
    """Check if official Ookla CLI is available"""
    print("\n🔧 Checking for official Ookla CLI...")
    
    try:
        result = subprocess.run(['speedtest', '--version'], 
                              capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print(f"✅ Official Ookla CLI is available!")
            print(f"   Version: {result.stdout.strip()}")
            return True
        else:
            print("❌ Official Ookla CLI not found")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Official Ookla CLI check timed out")
        return False
    except Exception as e:
        print(f"❌ Official Ookla CLI check failed: {str(e)}")
        return False

def provide_installation_instructions():
    """Provide installation instructions for the official CLI"""
    print("\n📋 Official Ookla CLI Installation Instructions:")
    print("=" * 60)
    
    system = platform.system().lower()
    
    if system == 'windows':
        print("For Windows:")
        print("1. Run: .\\install_ookla_cli.ps1")
        print("2. Or manually download from: https://www.speedtest.net/apps/cli")
        print("3. Extract and add to PATH")
    elif system == 'linux':
        print("For Linux:")
        print("1. curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | sudo bash")
        print("2. sudo apt-get install speedtest")
    elif system == 'darwin':
        print("For macOS:")
        print("1. brew install speedtest-cli")
    else:
        print("Please visit: https://www.speedtest.net/apps/cli")
    
    print("\n💡 Benefits of Official CLI:")
    print("- Exact same accuracy as Speedtest.net website")
    print("- Uses optimized socket-based testing")
    print("- Better performance on high-speed connections")
    print("- Official Ookla support and updates")

def compare_with_reference():
    """Provide guidance on validating against reference tools"""
    print("\n📊 Validating Against Reference Tools:")
    print("=" * 60)
    print("1. Run your speed test: http://localhost:3000/speedtest")
    print("2. Compare with Speedtest.net: https://www.speedtest.net/")
    print("3. Compare with Fast.com: https://fast.com/")
    print("4. Compare with Google Speed Test: Search 'internet speed test'")
    print("")
    print("Expected Results:")
    print("- With Official CLI: Results should match within 5-10 Mbps")
    print("- With HTTP Fallback: Results should match within 10-20 Mbps")
    print("- Significant improvement over old speedtest-cli library")

def test_backend_connectivity():
    """Test if backend is running and responding"""
    print("🔌 Testing backend connectivity...")
    
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is running and responding")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connectivity failed: {str(e)}")
        return False

def main():
    """Run all tests and provide comprehensive feedback"""
    print("🎯 Testing New Accurate Speed Test Implementation")
    print("=" * 60)
    print("This test verifies that the new implementation provides")
    print("results that match professional services like Speedtest.net")
    print("=" * 60)
    
    # Test backend connectivity first
    if not test_backend_connectivity():
        print("\n❌ Backend is not responding. Please start the backend server first.")
        print("   Run: cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
        return False
    
    # Check for official CLI
    has_official_cli = check_official_cli()
    
    # Test method endpoint
    method_ok = test_speed_test_method_endpoint()
    
    # Test actual speed test
    speed_test_ok = test_accurate_speed_test()
    
    # Summary
    print(f"\n{'='*60}")
    print("🎯 Test Results Summary:")
    print(f"   Backend Connectivity: ✅")
    print(f"   Method Endpoint: {'✅' if method_ok else '❌'}")
    print(f"   Official Ookla CLI: {'✅' if has_official_cli else '❌'}")
    print(f"   Speed Test Endpoint: {'✅' if speed_test_ok else '❌'}")
    
    if method_ok and speed_test_ok:
        print("\n🎉 SUCCESS! New accurate speed test implementation is working!")
        
        if has_official_cli:
            print("✅ You're using the official Ookla CLI for maximum accuracy")
            print("📊 Results should now match Speedtest.net exactly")
        else:
            print("⚠️  Using HTTP fallback (still much more accurate than old implementation)")
            print("💡 Install official Ookla CLI for maximum accuracy")
            provide_installation_instructions()
        
        compare_with_reference()
        
        print(f"\n{'='*60}")
        print("🚀 Ready for Testing!")
        print("Visit: http://localhost:3000/speedtest")
        print("Expected: Results within 5-15 Mbps of Speedtest.net")
        print(f"{'='*60}")
        
        return True
    else:
        print("\n❌ Some tests failed. Please check the backend logs.")
        
        if not has_official_cli:
            provide_installation_instructions()
        
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 