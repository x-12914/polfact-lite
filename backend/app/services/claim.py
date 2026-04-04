from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from app.models.claim import Claim, ClaimStatus
from app.schemas.claim import ClaimCreate, ClaimUpdate
from app.core.config import settings
from openai import OpenAI
import json
import logging

logger = logging.getLogger(__name__)

def create_claim(db: Session, *, obj_in: ClaimCreate) -> Claim:
    db_obj = Claim(
        poi_id=obj_in.poi_id,
        description=obj_in.description,
        status=obj_in.status,
        confidence=obj_in.confidence,
        date_reported=obj_in.date_reported
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_claim(db: Session, id: int) -> Optional[Claim]:
    return db.query(Claim).options(
        joinedload(Claim.media),
        joinedload(Claim.sources),
        joinedload(Claim.poi)
    ).filter(Claim.id == id, Claim.is_deleted == False).first()

def get_claims(db: Session, *, poi_id: Optional[int] = None, skip: int = 0, limit: int = 10, status: Optional[ClaimStatus] = None, search: Optional[str] = None) -> Tuple[List[Claim], int]:
    query = db.query(Claim).options(
        joinedload(Claim.media),
        joinedload(Claim.sources),
        joinedload(Claim.poi)
    ).filter(Claim.is_deleted == False)
    if poi_id:
        query = query.filter(Claim.poi_id == poi_id)
    if status:
        query = query.filter(Claim.status == status)
    if search:
        query = query.filter(Claim.description.ilike(f"%{search}%"))
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    return results, total

def update_claim(db: Session, *, db_obj: Claim, obj_in: ClaimUpdate) -> Claim:
    if obj_in.poi_id is not None: db_obj.poi_id = obj_in.poi_id
    if obj_in.description is not None: db_obj.description = obj_in.description
    if obj_in.status is not None: db_obj.status = obj_in.status
    if obj_in.confidence is not None: db_obj.confidence = obj_in.confidence
    if obj_in.date_reported is not None: db_obj.date_reported = obj_in.date_reported
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_claim(db: Session, *, id: int) -> Optional[Claim]:
    db_obj = db.query(Claim).filter(Claim.id == id).first()
    if db_obj:
        db_obj.is_deleted = True
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
    return db_obj

def analyze_claim(db: Session, id: int) -> Optional[Claim]:
    """
    Analyzes a claim using OpenAI.
    Sends the claim description and all attached evidence (sources and media transcripts) 
    to the model to determine the new status, confidence, and generating an insight.
    """
    claim = get_claim(db, id=id)
    if not claim:
        return None
    
    if not settings.OPENAI_API_KEY:
        logger.warning("OpenAI API key not configured. Falling back to mock analysis.")
        return _mock_analyze_claim(db, claim)

    # Gather evidence context
    evidence_text = ""
    
    if claim.sources:
        evidence_text += "\nVERIFIED SOURCES:\n"
        for i, s in enumerate(claim.sources):
            evidence_text += f"{i+1}. TITLE: {s.title}\n"
            if s.link: evidence_text += f"   LINK: {s.link}\n"
            if s.content: evidence_text += f"   CONTENT: {s.content}\n"
    
    if claim.media:
        evidence_text += "\nMEDIA EVIDENCE (TRANSCRIPTS):\n"
        for i, m in enumerate(claim.media):
            if m.transcription_text:
                evidence_text += f"{i+1}. TYPE: {m.type}\n"
                evidence_text += f"   TRANSCRIPTION: {m.transcription_text}\n"

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    prompt = f"""
    You are a professional fact-checker. Analyze the following claim based ONLY on the provided evidence.
    
    CLAIM TO VERIFY:
    "{claim.description}"
    
    {evidence_text if evidence_text else "NO DIRECT EVIDENCE PROVIDED."}
    
    Your task is to:
    1. Determine the VERDICT. Choose strictly from: fulfilled, partial, unfulfilled, ongoing.
       - fulfilled: The evidence strongly supports the claim.
       - partial: The evidence supports parts of the claim, but parts are missing or misleading.
       - unfulfilled: The evidence contradicts the claim.
       - ongoing: There is not enough evidence to make a conclusion yet.
    2. Provide a CONFIDENCE score between 0.0 and 1.0.
    3. Generate a concise AI INSIGHT (2-3 sentences) explaining the reasoning.
    
    Format the response strictly as a JSON object:
    {{
      "status": "fulfilled" | "partial" | "unfulfilled" | "ongoing",
      "confidence": 0.0,
      "insight": "..."
    }}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a factual analysis engine for PolFact."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Update claim
        claim.status = ClaimStatus(result.get("status", claim.status))
        claim.confidence = float(result.get("confidence", 0.0))
        claim.ai_insight = result.get("insight", "AI analysis completed.")
        
    except Exception as e:
        logger.error(f"OpenAI Claim Analysis failed: {e}")
        claim.ai_insight = f"Analysis error: {str(e)}"
        
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim

def _mock_analyze_claim(db: Session, claim: Claim) -> Claim:
    """Fallback mock logic"""
    media_count = len(claim.media)
    source_count = len(claim.sources)
    
    if media_count + source_count == 0:
        claim.ai_insight = "Insufficient evidence to verify this statement (Mock Analysis)."
        claim.status = ClaimStatus.ONGOING
        claim.confidence = 0.1
    elif media_count >= 1 and source_count >= 1:
        claim.ai_insight = f"Analysis of {media_count} media and {source_count} sources indicates high probability (Mock Analysis)."
        claim.status = ClaimStatus.FULFILLED
        claim.confidence = 0.85
    else:
        claim.ai_insight = "Partial evidence found (Mock Analysis)."
        claim.status = ClaimStatus.PARTIAL
        claim.confidence = 0.5
        
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim
