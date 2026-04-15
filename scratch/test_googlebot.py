
import requests

url = "https://medium.com/@iamtori996/shege-what-it-means-in-the-modern-nigerian-society-6d783ab13e8e"

headers = {
    "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
}

print("Testing with Googlebot User-Agent...")
try:
    response = requests.get(url, headers=headers, timeout=10)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success!")
    else:
        print(f"Failed with status {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
