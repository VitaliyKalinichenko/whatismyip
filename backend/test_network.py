import httpx
import asyncio

async def test_network():
    """Test network connectivity to external IP services"""
    services = [
        "https://api.ipify.org?format=json",
        "https://httpbin.org/ip",
        "https://ipapi.co/ip/"
    ]
    
    for service in services:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(service, timeout=3.0)
                print(f"✅ {service}: Status {response.status_code}, Response: {response.text[:100]}")
        except Exception as e:
            print(f"❌ {service}: Error - {e}")

if __name__ == "__main__":
    asyncio.run(test_network()) 