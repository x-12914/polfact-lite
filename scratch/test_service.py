import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
from app.services.research import scrape_article

url = "https://medium.com/@iamtori996/shege-what-it-means-in-the-modern-nigerian-society-6d783ab13e8e"
print("Testing scrape_article with Jina Reader...")
content = scrape_article(url)

print(f"Extraction result length: {len(content)}")
if content.startswith("Error:"):
    print(f"Test Failed: {content}")
else:
    print("Test Passed. Successfully extracted content.")
    print("Preview of content:")
    print(content[:200])
