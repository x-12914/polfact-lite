import requests

urls = [
    "https://www.tiktok.com/@iyaboojo",
    "https://www.facebook.com/groups/1176394000158557/",
    "https://medium.com/open-microphone/what-went-wrong-with-medium-6d2892cc9398",
    "https://punchng.com/dismissed-soldier-soja-boi-backs-pay-claims-with-receipts-dares-army-to-release-payroll/"
]

for url in urls:
    print(f"\nTesting Jina with: {url}")
    try:
        response = requests.get(f"https://r.jina.ai/{url}", timeout=15)
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"Error Text: {response.text[:200]}")
        else:
            print(f"Content Length: {len(response.text)}")
    except Exception as e:
        print(f"Exception: {e}")
