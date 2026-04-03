from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from app.models.claim import Claim, ClaimStatus
from app.schemas.claim import ClaimCreate, ClaimUpdate

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
    Simulates AI analysis of a claim.
    In the Lite version, this looks at evidence and generates a mock insight.
    """
    claim = get_claim(db, id=id)
    if not claim:
        return None
    
    # Count evidence
    media_count = len(claim.media)
    source_count = len(claim.sources)
    
    # Mock analysis logic based on evidence presence
    if media_count + source_count == 0:
        claim.ai_insight = "Insufficient evidence to verify this statement. Please add more media or sources."
        claim.status = ClaimStatus.ONGOING
        claim.confidence = 0.1
    elif media_count >= 1 and source_count >= 1:
        claim.ai_insight = f"Analysis of {media_count} media files and {source_count} indexed sources indicates high probability of accuracy. Verified against official records."
        claim.status = ClaimStatus.FULFILLED
        claim.confidence = 0.85
    elif media_count > 0:
        claim.ai_insight = "Media evidence provided shows partial alignment with the claim, but lacks corroboration from official sources."
        claim.status = ClaimStatus.PARTIAL
        claim.confidence = 0.6
    else:
        claim.ai_insight = "Primary source references are present, however, direct media evidence is missing to fully validate the context."
        claim.status = ClaimStatus.PARTIAL
        claim.confidence = 0.5
        
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim
