#!/usr/bin/env python3
"""
Test script to verify admin login with hardcoded credentials
"""

import requests
import json

def test_admin_login():
    """Test admin login with hardcoded credentials"""
    
    # Test credentials
    credentials = {
        "email": "veremij@ukr.net",
        "password": "Qwerty!67890"
    }
    
    # Test admin status endpoint
    print("🔍 Testing admin system status...")
    try:
        status_response = requests.get("http://localhost:8000/api/v1/admin/auth/status")
        if status_response.status_code == 200:
            status_data = status_response.json()
            print(f"✅ Admin system status: {status_data}")
        else:
            print(f"❌ Admin status failed: {status_response.status_code}")
    except Exception as e:
        print(f"❌ Error checking admin status: {e}")
    
    # Test admin login
    print("\n🔐 Testing admin login...")
    try:
        login_response = requests.post(
            "http://localhost:8000/api/v1/admin/auth/login",
            json=credentials,
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            print(f"✅ Login successful!")
            print(f"   Access token: {login_data.get('access_token', 'N/A')[:20]}...")
            print(f"   User: {login_data.get('user', {}).get('email', 'N/A')}")
            print(f"   Role: {login_data.get('user', {}).get('role', 'N/A')}")
            
            # Test token verification
            token = login_data.get('access_token')
            if token:
                print("\n🔍 Testing token verification...")
                verify_response = requests.get(
                    "http://localhost:8000/api/v1/admin/auth/verify-token",
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    print(f"✅ Token verification successful: {verify_data}")
                else:
                    print(f"❌ Token verification failed: {verify_response.status_code}")
                    
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            try:
                error_data = login_response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Error: {login_response.text}")
                
    except Exception as e:
        print(f"❌ Error during login test: {e}")

if __name__ == "__main__":
    test_admin_login() 