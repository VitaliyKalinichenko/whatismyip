#!/usr/bin/env python3
"""
Simple test script to check backend connectivity
"""

import requests
import sys
import time

def test_backend():
    """Test if backend is accessible"""
    backend_url = "http://localhost:8000"
    
    print("🔍 Testing backend connectivity...")
    
    # Test 1: Basic health check
    try:
        response = requests.get(f"{backend_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend health check: PASSED")
        else:
            print(f"❌ Backend health check: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend health check: FAILED - {e}")
        return False
    
    # Test 2: IP info endpoint
    try:
        response = requests.get(f"{backend_url}/api/v1/ip-info", timeout=10)
        if response.status_code == 200:
            data = response.json()
            ip = data.get('ip')
            print(f"✅ IP info endpoint: PASSED (IP: {ip})")
            return True
        else:
            print(f"❌ IP info endpoint: FAILED (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ IP info endpoint: FAILED - {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("BACKEND CONNECTIVITY TEST")
    print("=" * 50)
    
    success = test_backend()
    
    if success:
        print("\n🎉 Backend is working correctly!")
        sys.exit(0)
    else:
        print("\n💥 Backend connectivity issues detected!")
        print("\nTroubleshooting steps:")
        print("1. Make sure the backend server is running:")
        print("   cd backend")
        print("   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        print("2. Check if port 8000 is available")
        print("3. Check for any error messages in the backend console")
        sys.exit(1) 