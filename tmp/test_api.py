import requests
import json

params = {
    'models': 'deepfake',
    'api_user': '1977380819',
    'api_secret': 'VYKTRrxnbDiCMEKdyqEA9DddaY9cSAtF'
}

with open(r"C:\Users\xxx85\.gemini\antigravity\brain\53bc5a24-24dd-4ac6-9250-48d28706edaf\blank_scene_1775511024011.png", 'rb') as f:
    r = requests.post('https://api.sightengine.com/1.0/check.json', files={'media': f}, data=params)

print(json.dumps(r.json(), indent=2))
