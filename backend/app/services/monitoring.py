import requests
import logging
import json
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.monitored_site import MonitoredSite, MonitoredArticle
from app.core.config import settings
from openai import OpenAI
from app.services.research import scrape_article

logger = logging.getLogger(__name__)

def get_sites(db: Session, skip: int = 0, limit: int = 100) -> List[MonitoredSite]:
    return db.query(MonitoredSite).offset(skip).limit(limit).all()

def create_site(db: Session, *, name: str, url: str) -> MonitoredSite:
    # Clean URL slightly if needed
    cleaned_url = url.strip().lower()
    if not cleaned_url.startswith("http://") and not cleaned_url.startswith("https://"):
        cleaned_url = "https://" + cleaned_url
        
    db_obj = MonitoredSite(
        site_name=name.strip(),
        site_url=cleaned_url
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_site(db: Session, *, id: int) -> Optional[MonitoredSite]:
    db_obj = db.query(MonitoredSite).filter(MonitoredSite.id == id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj

def get_articles(db: Session, skip: int = 0, limit: int = 100) -> List[MonitoredArticle]:
    return db.query(MonitoredArticle).order_by(MonitoredArticle.created_at.desc()).offset(skip).limit(limit).all()

def _search_web_internal(query: str, num_results: int = 5) -> List[Dict[str, Any]]:
    if not settings.SERPER_API_KEY:
        logger.warning("SERPER_API_KEY not configured. Search returned empty.")
        return []
    try:
        resp = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": settings.SERPER_API_KEY.strip(), "Content-Type": "application/json"},
            json={"q": query, "num": num_results},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        results = []
        for item in data.get("organic", []):
            results.append({
                "title": item.get("title", ""),
                "link": item.get("link", ""),
                "snippet": item.get("snippet", "")
            })
        return results
    except Exception as e:
        logger.error(f"Internal Serp search failed for query '{query}': {e}")
        return []

def _extract_claims_from_text(text: str) -> List[Dict[str, str]]:
    if not settings.OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not configured. Falling back to empty claims.")
        return []
    
    client = OpenAI(api_key=settings.OPENAI_API_KEY.strip())
    prompt = f"""
    Analyze the following news text. Extract up to 3 major, verifiable factual statements/claims regarding the election, candidates, or polling.
    For each claim, you must find the exact quote from the text that serves as direct evidence.
    
    Return strictly as a JSON object:
    {{
      "claims": [
        {{ "text": "Extracted claim statement", "quote": "The exact quote from the text" }}
      ]
    }}
    
    TEXT:
    {text[:8000]}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "You are a professional election news fact-extractor."},
                      {"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        res = json.loads(response.choices[0].message.content)
        return res.get("claims", [])
    except Exception as e:
        logger.error(f"Failed to extract claims using OpenAI: {e}")
        return []

def _verify_claim_autonomously(claim_text: str) -> Dict[str, Any]:
    # 1. Google search this claim for evidence
    search_results = _search_web_internal(claim_text, num_results=3)
    
    # 2. Gather context
    context_str = ""
    for idx, res in enumerate(search_results):
        context_str += f"{idx+1}. TITLE: {res['title']}\n"
        context_str += f"   LINK: {res['link']}\n"
        context_str += f"   SNIPPET: {res['snippet']}\n\n"
        
    if not settings.OPENAI_API_KEY:
        return {
            "status": "ongoing",
            "confidence": 0.5,
            "ai_insight": "OpenAI API Key not configured. Auto-verifying standby."
        }
        
    client = OpenAI(api_key=settings.OPENAI_API_KEY.strip())
    prompt = f"""
    You are Fact Checker AI Verification Core. Verify this claim statement based ONLY on the compiled search result snippets.
    
    CLAIM STATEMENT:
    "{claim_text}"
    
    SEARCH RESULT SNIPPETS:
    {context_str if context_str else "No search results returned."}
    
    Your task:
    1. Select a verdict status strictly from: fulfilled (true), partial (misleading/partially true), unfulfilled (false/fake news), ongoing (needs more info).
    2. Provide a confidence float rating between 0.0 and 1.0.
    3. Generate a concise 2-sentence fact-checking review explanation (AI Insight).
    
    Return strictly as a JSON object:
    {{
      "status": "fulfilled" | "partial" | "unfulfilled" | "ongoing",
      "confidence": 0.0,
      "ai_insight": "..."
    }}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "You are a professional fact-checker."},
                      {"role": "user", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        res = json.loads(response.choices[0].message.content)
        return {
            "status": res.get("status", "ongoing"),
            "confidence": float(res.get("confidence", 0.5)),
            "ai_insight": res.get("ai_insight", "AI verified claim.")
        }
    except Exception as e:
        logger.error(f"Autonomous verification check failed: {e}")
        return {
            "status": "ongoing",
            "confidence": 0.5,
            "ai_insight": "Autonomous verification failed to run."
        }

def run_monitoring_scan(db: Session) -> Dict[str, Any]:
    """
    Crawls active whitelisted domains using site searches, scrapes recent articles,
    extracts claims, cross-references them online, and saves verified results.
    Runs inside background tasks synchronously.
    """
    sites = db.query(MonitoredSite).filter(MonitoredSite.is_active == True).all()
    articles_scraped = 0
    claims_verified = 0
    
    logger.info(f"Firing autonomous scanning cycle for {len(sites)} whitelisted domains...")
    
    for site in sites:
        try:
            # 1. Clean domain for Google site search
            parsed = urlparse(site.site_url)
            domain = parsed.netloc or parsed.path
            if domain.startswith("www."):
                domain = domain[4:]
            
            # Query recent election articles published on this domain
            search_query = f"site:{domain} election"
            logger.info(f"Querying indexed posts for site '{site.site_name}' via: {search_query}")
            organic_results = _search_web_internal(search_query, num_results=5)
            
            for res in organic_results:
                link = res.get("link")
                title = res.get("title")
                if not link or not title:
                    continue
                    
                # 2. Check if we already audited this article URL
                existing = db.query(MonitoredArticle).filter(MonitoredArticle.url == link).first()
                if existing:
                    continue
                    
                # 3. Scrape full content using Jina
                logger.info(f"Autonomous scraping article: {link}")
                content = scrape_article(link)
                if content.startswith("Error:"):
                    continue
                    
                # 4. Extract claims and direct quotes from text
                extracted_raw = _extract_claims_from_text(content)
                verified_claims = []
                
                # 5. Run autonomous cross-referencing and validation for each claim
                for c in extracted_raw:
                    claim_text = c.get("text")
                    quote = c.get("quote")
                    if not claim_text:
                        continue
                        
                    logger.info(f"Autonomous verifying claim: '{claim_text}'")
                    verification = _verify_claim_autonomously(claim_text)
                    
                    verified_claims.append({
                        "text": claim_text,
                        "quote": quote,
                        "status": verification.get("status", "ongoing"),
                        "confidence": verification.get("confidence", 0.5),
                        "ai_insight": verification.get("ai_insight", "AI verified.")
                    })
                    claims_verified += 1
                
                # 6. Save audited article
                monitored_art = MonitoredArticle(
                    site_id=site.id,
                    url=link,
                    title=title,
                    content=content[:5000], # Keep a reasonable size in DB
                    extracted_claims=verified_claims
                )
                db.add(monitored_art)
                articles_scraped += 1
                
            # Update site last scraped timestamp
            site.last_scraped = func.now()
            db.add(site)
            db.commit()
            
        except Exception as site_e:
            logger.error(f"Error executing site monitor for '{site.site_name}': {site_e}")
            db.rollback()
            
    return {
        "success": True,
        "articles_processed": articles_scraped,
        "claims_audited": claims_verified
    }
