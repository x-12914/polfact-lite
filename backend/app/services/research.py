import requests

from openai import OpenAI
from app.core.config import settings
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

def scrape_article(url: str) -> str:
    """
    Scrapes the main text content from a given URL using Jina Reader to bypass bot protection.
    """
    # Use Jina Reader to bypass bot detection and get clean content
    jina_url = f"https://r.jina.ai/{url}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
    }
    
    if settings.JINA_API_KEY and settings.JINA_API_KEY.strip():
        headers["Authorization"] = f"Bearer {settings.JINA_API_KEY.strip()}"
        
    try:
        response = requests.get(jina_url, timeout=20, headers=headers)
        response.raise_for_status()

        text = response.text
        
        # Jina returns markdown/text. If it failed or returned a "blocked" message:
        if "blocked" in text.lower()[:500] and "bot" in text.lower()[:500]:
            return f"Error: Scraping blocked (Bot detection triggered even through proxy)."

        # Simple cleaning of extra whitespace
        lines = (line.strip() for line in text.splitlines())
        text = '\n'.join(line for line in lines if line)
        
        if len(text.strip()) < 100:
             return f"Error: Extracted content is too short. The page might be empty or require an account to view."

        # Limit to first 10,000 characters to avoid token limits
        return text[:10000]
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            logger.error(f"403 Forbidden even with Jina Reader for {url}")
            return f"Error: Content at {url} is strictly protected against scraping (403)."
        logger.error(f"HTTP error scraping {url} via Jina: {e}")
        return f"Error: Could not extract content from {url} (HTTP {e.response.status_code})."
    except Exception as e:
        logger.error(f"Error scraping {url} via Jina: {e}")
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
    
    client = OpenAI(api_key=settings.OPENAI_API_KEY.strip())
    
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
