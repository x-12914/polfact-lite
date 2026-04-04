import os
from openai import OpenAI
from dotenv import load_dotenv

# Load from the backend .env file
load_dotenv('backend/.env')

api_key = os.getenv('OPENAI_API_KEY')
print(f"Testing key ending in: ...{api_key[-4:] if api_key else 'None'}")
print(f"Key length: {len(api_key) if api_key else 0}")

client = OpenAI(api_key=api_key.strip())

try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Hello, respond with 'Valid Key'"}],
        max_tokens=5
    )
    print(f"Success! Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"Failure! Error: {e}")
