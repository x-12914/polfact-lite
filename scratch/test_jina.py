
import requests

url = "https://r.jina.ai/https://medium.com/@iamtori996/shege-what-it-means-in-the-modern-nigerian-society-6d783ab13e8e"

print("Testing with Jina Reader...")
try:
    response = requests.get(url, timeout=15)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success!")
        print(f"Content length: {len(response.text)}")
        # print(response.text[:200])
    else:
        print(f"Failed with status {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
