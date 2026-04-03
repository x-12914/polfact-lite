from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.models.evidence import Evidence, EvidenceStatus

def create_evidence(db: Session, claim_id: int, uploaded_by: int, file_url: str, evidence_type: str, description: Optional[str] = None) -> Evidence:
    evidence = Evidence(
        claim_id=claim_id,
        uploaded_by=uploaded_by,
        file_url=file_url,
        type=evidence_type,
        description=description,
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence

def get_evidence(db: Session, evidence_id: int) -> Optional[Evidence]:
    return db.query(Evidence).filter(Evidence.id == evidence_id).first()

def get_claim_evidence(db: Session, claim_id: int) -> List[Evidence]:
    return db.query(Evidence).filter(Evidence.claim_id == claim_id).all()

def get_user_evidence(db: Session, user_id: int) -> List[Evidence]:
    return db.query(Evidence).filter(Evidence.uploaded_by == user_id).all()

def delete_evidence(db: Session, evidence_id: int) -> bool:
    evidence = get_evidence(db, evidence_id)
    if evidence:
        db.delete(evidence)
        db.commit()
        return True
    return False

def get_pending_evidence(db: Session, skip: int = 0, limit: int = 10) -> Tuple[List[Evidence], int]:
    query = db.query(Evidence).filter(Evidence.status == EvidenceStatus.PENDING)
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    return results, total
