"""Quick API test script"""
import httpx

base = "http://localhost:8001"

# Test SEO endpoints
print("=== Testing SEO endpoints ===")
try:
    r = httpx.get(f"{base}/api/admin/seo")
    print(f"GET /api/admin/seo: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  -> {len(data)} items")
except Exception as e:
    print(f"  Error: {e}")

try:
    r = httpx.get(f"{base}/api/seo/meta?path=/")
    print(f"GET /api/seo/meta: {r.status_code}")
except Exception as e:
    print(f"  Error: {e}")

# Test stocks endpoint (debug 500)
print("\n=== Testing stocks endpoint ===")
try:
    r = httpx.get(f"{base}/api/stocks?page=1&page_size=5")
    print(f"GET /api/stocks: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"  -> total: {data.get('total', 'N/A')}")
except Exception as e:
    print(f"  Error: {e}")
