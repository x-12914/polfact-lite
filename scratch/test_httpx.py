
import httpx

url = "https://medium.com/@iamtori996/shege-what-it-means-in-the-modern-nigerian-society-6d783ab13e8e"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
}

print("Testing with httpx...")
try:
    with httpx.Client(http2=True) as client:
        response = client.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Success!")
        else:
            print(f"Failed with status {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
