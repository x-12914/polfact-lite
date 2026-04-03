import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from app.core.config import settings
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

def scrape_article(url: str) -> str:
    """
    Scrapes the main text content from a given URL.
    """
    try:
        response = requests.get(url, timeout=15, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }, allow_redirects=True)
        response.raise_for_status()

        # Detect common login redirects or anti-bot pages
        lower_url = response.url.lower()
        if "login" in lower_url or "checkpoint/lg" in lower_url or "signup" in lower_url:
            return f"Error: Content blocked by a login wall or bot protection (Redirected to login)."

        # Check if page is extremely short (common for "verify you are human" pages)
        if len(response.text) < 500 and ("detect" in response.text.lower() or "human" in response.text.lower()):
            return f"Error: Scraping blocked (Bot detection triggered)."

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script_or_style in soup(["script", "style", "nav", "footer", "header", "form"]):
            script_or_style.decompose()
            
        # Get text
        text = soup.get_text(separator=' ')
        
        # Break into lines and remove leading/trailing whitespace
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        if len(text.strip()) < 100:
             return f"Error: Extracted content is too short. The page might be empty or require an account to view."

        # Limit to first 10,000 characters to avoid token limits
        return text[:10000]
    except Exception as e:
        logger.error(f"Error scraping {url}: {e}")
        return f"Error: Could not extract content from {url}."

def analyze_research_content(text: str, focus_entity: Optional[str] = None) -> Dict[str, Any]:
    """
    Uses OpenAI to analyze the scraped content.
    If focus_entity is provided, the analysis centers on that specific person/entity.
    """
    if not settings.OPENAI_API_KEY:
        return {
            "summary": "OpenAI API key not configured.",
            "claims": [],
            "bias": "Unknown"
        }
    
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    focus_instruction = ""
    if focus_entity:
        focus_instruction = f"FOCUS YOUR ENTIRE ANALYSIS ON: '{focus_entity}'. Only extract claims and information directly involving or relevant to them."

    prompt = f"""
    Perform a deep analysis of the ENTIRE text provided below. 
    {focus_instruction}
    Do not just summarize; extract specific, verifiable intelligence:
    
    1. SUMMARY: A concise 2-3 sentence overview. {('Focus on ' + focus_entity) if focus_entity else ''}
    2. CLAIMS: A comprehensive list of 5-8 specific factual claims. {('Only related to ' + focus_entity + '.') if focus_entity else ''}
       For EACH claim, you must find an EXACT character-for-character quote from the article that serves as evidence.

    Format the response strictly as a JSON object with this structure:
    {{
      "summary": "...",
      "claims": [
        {{ "text": "The claim statement", "quote": "The exact quote from the text" }},
        ...
      ],
      "tone": "..."
    }}

    TEXT TO ANALYZE:
    {text}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "You are a factual research assistant."},
                      {"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        logger.error(f"OpenAI analysis failed: {e}")
        return {
            "summary": "AI Analysis failed to process the content.",
            "claims": [],
            "tone": "Error"
        }
