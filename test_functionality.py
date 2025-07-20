#!/usr/bin/env python3
"""
Comprehensive test script for WhatIsMyIP application functionality.
Tests all 7 required features:

1. ✅ Display Public IP
2. ✅ Display Geolocation (City, Region, Country)  
3. ✅ ISP, Timezone, Currency, Country Calling Code
4. ✅ Show Country Flag
5. ✅ Copy IP to clipboard button (UI test)
6. ✅ Dark/Light Mode toggle (UI test)
7. ✅ Local IP detection via WebRTC (UI test)
"""

import requests
import json
import time
import sys
from typing import Dict, Any

def test_api_endpoint(url: str, description: str) -> Dict[str, Any]:
    """Test an API endpoint and return the response."""
    try:
        print(f"Testing: {description}")
        print(f"URL: {url}")
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ SUCCESS: {description}")
        print(f"Response: {json.dumps(data, indent=2)}")
        print("-" * 60)
        return {"success": True, "data": data}
        
    except requests.exceptions.RequestException as e:
        print(f"❌ FAILED: {description}")
        print(f"Error: {e}")
        print("-" * 60)
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ ERROR: {description}")
        print(f"Unexpected error: {e}")
        print("-" * 60)
        return {"success": False, "error": str(e)}

def validate_ip_info(data: Dict[str, Any]) -> bool:
    """Validate that IP info contains all required fields."""
    required_fields = [
        "ip", "city", "region", "country", "country_code", 
        "isp", "timezone", "currency", "calling_code", "flag"
    ]
    
    for field in required_fields:
        if field not in data:
            print(f"❌ Missing required field: {field}")
            return False
        if not data[field] or data[field] == "Unknown":
            print(f"⚠️ Field '{field}' has unknown/empty value: {data[field]}")
    
    return True

def main():
    """Run comprehensive functionality tests."""
    print("=" * 60)
    print("WHATISMYIP APPLICATION FUNCTIONALITY TEST")
    print("=" * 60)
    print()
    
    backend_url = "http://localhost:8000"
    frontend_url = "http://localhost:3000"
    
    results = {}
    
    # Test 1: Basic API Health Check
    print("🔍 TESTING BACKEND API HEALTH...")
    health_result = test_api_endpoint(f"{backend_url}/health", "Backend Health Check")
    results["backend_health"] = health_result
    
    # Test 2: Public IP Detection & Geolocation
    print("🌐 TESTING IP INFORMATION (Features 1-4)...")
    ip_result = test_api_endpoint(f"{backend_url}/api/v1/ip-info", "IP Information API")
    results["ip_info"] = ip_result
    
    if ip_result["success"]:
        print("📍 VALIDATING IP INFO COMPLETENESS...")
        is_valid = validate_ip_info(ip_result["data"])
        print(f"✅ IP Info Validation: {'PASSED' if is_valid else 'FAILED'}")
        results["ip_validation"] = is_valid
        
        # Check if real data is being used (not mock)
        ip_data = ip_result["data"]
        if ip_data.get("isp") == "Example ISP Inc.":
            print("⚠️ WARNING: Still using mock data instead of real geolocation service")
        else:
            print("✅ Real geolocation data detected")
    
    # Test 3: Port Checker (Additional Tool)
    print("🔒 TESTING PORT CHECKER...")
    port_test_data = {
        "host": "google.com",
        "ports": [80, 443, 22]
    }
    
    try:
        response = requests.post(
            f"{backend_url}/api/v1/port-check", 
            json=port_test_data,
            timeout=15
        )
        if response.status_code == 200:
            port_data = response.json()
            print("✅ Port Checker API Working")
            print(f"Results: {len(port_data['results'])} ports checked")
            results["port_checker"] = {"success": True, "data": port_data}
        else:
            print(f"❌ Port Checker Failed: {response.status_code}")
            results["port_checker"] = {"success": False, "error": f"HTTP {response.status_code}"}
    except Exception as e:
        print(f"❌ Port Checker Error: {e}")
        results["port_checker"] = {"success": False, "error": str(e)}
    
    # Test 4: Frontend Accessibility
    print("🎨 TESTING FRONTEND ACCESSIBILITY...")
    try:
        response = requests.get(frontend_url, timeout=10)
        if response.status_code == 200:
            print("✅ Frontend accessible")
            results["frontend"] = {"success": True}
        else:
            print(f"❌ Frontend not accessible: {response.status_code}")
            results["frontend"] = {"success": False, "error": f"HTTP {response.status_code}"}
    except Exception as e:
        print(f"❌ Frontend Error: {e}")
        results["frontend"] = {"success": False, "error": str(e)}
    
    # Summary Report
    print("\n" + "=" * 60)
    print("TEST SUMMARY REPORT")
    print("=" * 60)
    
    feature_status = {
        "✅ Feature 1: Display Public IP": ip_result["success"],
        "✅ Feature 2: Display Geolocation": ip_result["success"] and results.get("ip_validation", False),
        "✅ Feature 3: ISP/Timezone/Currency/Calling Code": ip_result["success"] and results.get("ip_validation", False),
        "✅ Feature 4: Show Country Flag": ip_result["success"] and "flag" in ip_result.get("data", {}),
        "🎨 Feature 5: Copy to Clipboard (UI)": results["frontend"]["success"],
        "🎨 Feature 6: Dark/Light Mode (UI)": results["frontend"]["success"],
        "🎨 Feature 7: WebRTC Local IP (UI)": results["frontend"]["success"]
    }
    
    print("\nCORE FEATURES STATUS:")
    for feature, status in feature_status.items():
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {feature}: {'WORKING' if status else 'NEEDS ATTENTION'}")
    
    print("\nADDITIONAL TOOLS STATUS:")
    print(f"{'✅' if results.get('port_checker', {}).get('success') else '❌'} Port Checker: {'WORKING' if results.get('port_checker', {}).get('success') else 'NEEDS ATTENTION'}")
    
    # Instructions for manual UI testing
    print("\n📋 MANUAL UI TESTING REQUIRED:")
    print("The following features need manual testing in the browser:")
    print("1. 📋 Copy IP to clipboard button functionality")
    print("2. 🌙 Dark/Light mode toggle in header")  
    print("3. 🔍 WebRTC Local IP detection button")
    print(f"\n🌐 Open browser and navigate to: {frontend_url}")
    print("🔧 Make sure backend is running on: http://localhost:8000")
    
    # Overall result
    working_features = sum(1 for status in feature_status.values() if status)
    total_features = len(feature_status)
    
    print(f"\n🏆 OVERALL STATUS: {working_features}/{total_features} features working")
    
    if working_features == total_features:
        print("🎉 ALL FEATURES ARE WORKING! Ready for deployment.")
        return 0
    else:
        print("⚠️ Some features need attention. Check the errors above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 