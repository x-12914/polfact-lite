import requests
from bs4 import BeautifulSoup
import sys

def search_ddg(query):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    resp = requests.post("https://html.duckduckgo.com/html/", data={"q": query}, headers=headers)
    soup = BeautifulSoup(resp.text, 'html.parser')
    for a in soup.find_all('a', class_='result__snippet'):
        print(a.text)

search_ddg(sys.argv[1])
