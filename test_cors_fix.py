#!/usr/bin/env python3
"""
Test script to verify CORS configuration is working correctly
"""

import requests
import json
import os

def test_cors_configuration():
    """Test CORS configuration with different scenarios."""
    
    base_url = "http://localhost:8000"
    
    print("🔒 Testing CORS Configuration")
    print("=" * 50)
    
    # Test 1: Valid origin (should work)
    print("\n1. Testing with valid origin (localhost:3000)...")
    try:
        response = requests.get(
            f"{base_url}/api/v1/ip-info",
            headers={"Origin": "http://localhost:3000"}
        )
        print(f"   Status: {response.status_code}")
        print(f"   CORS Headers: {dict(response.headers)}")
        if "Access-Control-Allow-Origin" in response.headers:
            print(f"   ✅ CORS Origin: {response.headers['Access-Control-Allow-Origin']}")
        else:
            print("   ❌ No CORS headers found")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Invalid origin (should be blocked)
    print("\n2. Testing with invalid origin (malicious-site.com)...")
    try:
        response = requests.get(
            f"{base_url}/api/v1/ip-info",
            headers={"Origin": "https://malicious-site.com"}
        )
        print(f"   Status: {response.status_code}")
        if "Access-Control-Allow-Origin" in response.headers:
            print(f"   ⚠️  CORS Origin: {response.headers['Access-Control-Allow-Origin']}")
            if response.headers['Access-Control-Allow-Origin'] == "https://malicious-site.com":
                print("   ❌ SECURITY ISSUE: Malicious origin allowed!")
            else:
                print("   ✅ Malicious origin properly blocked")
        else:
            print("   ✅ No CORS headers for invalid origin")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Security headers
    print("\n3. Testing security headers...")
    try:
        response = requests.get(f"{base_url}/api/v1/ip-info")
        print(f"   Status: {response.status_code}")
        
        security_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options", 
            "X-XSS-Protection",
            "Referrer-Policy",
            "Permissions-Policy"
        ]
        
        for header in security_headers:
            if header in response.headers:
                print(f"   ✅ {header}: {response.headers[header]}")
            else:
                print(f"   ❌ {header}: Missing")
                
        # Check for server information leakage
        if "Server" in response.headers:
            print(f"   ⚠️  Server header exposed: {response.headers['Server']}")
        else:
            print("   ✅ Server header properly hidden")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Preflight request
    print("\n4. Testing CORS preflight request...")
    try:
        response = requests.options(
            f"{base_url}/api/v1/ip-info",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Content-Type"
            }
        )
        print(f"   Status: {response.status_code}")
        print(f"   CORS Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("   ✅ Preflight request successful")
        else:
            print("   ❌ Preflight request failed")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 5: Environment variable validation
    print("\n5. Testing environment variable validation...")
    current_env = os.getenv("ENVIRONMENT", "development")
    current_cors = os.getenv("CORS_ORIGINS", "Not set")
    print(f"   Environment: {current_env}")
    print(f"   CORS_ORIGINS: {current_cors}")
    
    if current_env == "production" and current_cors == "Not set":
        print("   ⚠️  WARNING: CORS_ORIGINS not set in production!")
    elif "*" in current_cors and current_env == "production":
        print("   ❌ CRITICAL: Wildcard CORS in production!")
    else:
        print("   ✅ CORS configuration looks secure")
    
    print("\n" + "=" * 50)
    print("🔒 CORS Configuration Test Complete")

if __name__ == "__main__":
    test_cors_configuration() 