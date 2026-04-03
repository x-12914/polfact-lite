"""
Web scraper endpoint — synchronous implementation (no Celery).
Returns results directly since we run the search inline.
"""
import requests
import logging
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.api import deps
from app.schemas.response import ResponseModel
from app.core.config import settings
from app.services import research as research_service

router = APIRouter()
logger = logging.getLogger(__name__)


class SearchRequest(BaseModel):
    query: str
    num_results: int = 10


class SearchResult(BaseModel):
    title: str
    link: str
    snippet: Optional[str] = None


@router.post("/search", response_model=ResponseModel[List[SearchResult]])
def search_web(
    *,
    request: SearchRequest,
    current_user: deps.User = Depends(deps.get_current_journalist),
) -> Any:
    """
    Perform a web search using Serper API and return a list of links.
    Runs synchronously — no Celery/task polling needed.
    """
    if not settings.SERPER_API_KEY:
        raise HTTPException(status_code=503, detail="SERPER_API_KEY not configured")

    try:
        resp = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": settings.SERPER_API_KEY, "Content-Type": "application/json"},
            json={"q": request.query, "num": request.num_results},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        logger.error(f"Serper search failed: {e}")
        raise HTTPException(status_code=502, detail="Search service unavailable")

    results = []
    for item in data.get("organic", []):
        results.append(SearchResult(
            title=item.get("title", ""),
            link=item.get("link", ""),
            snippet=item.get("snippet"),
        ))

    return ResponseModel(data=results, message=f"Found {len(results)} results")


class ResearchRequest(BaseModel):
    url: str
    focus_entity: Optional[str] = None


class ClaimItem(BaseModel):
    text: str
    quote: str

class ResearchResult(BaseModel):
    url: str
    summary: str
    claims: List[ClaimItem]
    tone: str


@router.post("/research", response_model=ResponseModel[ResearchResult])
def perform_research(
    *,
    request: ResearchRequest,
    current_user: deps.User = Depends(deps.get_current_journalist),
) -> Any:
    """
    Extract article content from a URL and perform AI analysis.
    """
    text = research_service.scrape_article(request.url)
    if text.startswith("Error:"):
        raise HTTPException(status_code=400, detail=text)
    
    analysis = research_service.analyze_research_content(text, request.focus_entity)
    
    # Extract claims safely, handling both object and string formats
    raw_claims = analysis.get("claims", [])
    processed_claims = []
    
    for c in raw_claims:
        if isinstance(c, dict):
            # If GPT used 'claim' instead of 'text', map it
            text = c.get("text") or c.get("claim") or "Untitled Claim"
            quote = c.get("quote") or c.get("evidence") or "No direct quote extracted."
            processed_claims.append(ClaimItem(text=text, quote=quote))
        else:
            # Handle string fallback
            processed_claims.append(ClaimItem(text=str(c), quote="No direct quote extracted."))
    
    result = ResearchResult(
        url=request.url,
        summary=analysis.get("summary", ""),
        claims=processed_claims,
        tone=analysis.get("tone", "Neutral")
    )
    
    return ResponseModel(data=result, message="Research analysis complete")
