from typing import Any, List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.claim import Claim, ClaimStatus
from app.models.poi import POI
from app.schemas.response import ResponseModel
from sqlalchemy import func, desc

router = APIRouter()

@router.get("/claims", response_model=ResponseModel[Dict[str, int]])
def read_claim_stats(db: Session = Depends(deps.get_db)) -> Any:
    stats = db.query(Claim.status, func.count(Claim.id)).filter(Claim.is_deleted == False).group_by(Claim.status).all()
    result = {s.value: count for s, count in stats}
    for s in ClaimStatus:
        if s.value not in result:
            result[s.value] = 0
    return ResponseModel(data=result)

@router.get("/activity", response_model=ResponseModel[List[Dict[str, Any]]])
def read_recent_activity(db: Session = Depends(deps.get_db), limit: int = 10) -> Any:
    recent_claims = db.query(Claim, POI).join(POI).filter(Claim.is_deleted == False).order_by(desc(Claim.created_at)).limit(limit).all()
    activities = []
    for claim, poi in recent_claims:
        activities.append({
            "id": claim.id,
            "action": f"Claim: {claim.description[:50]}{'...' if len(claim.description) > 50 else ''}",
            "detail": f"POI: {poi.name} | Status: {claim.status.value}",
            "time": claim.created_at.isoformat() if claim.created_at else None,
            "poi": poi.name,
            "poi_image": poi.profile_image,
            "status": claim.status.value
        })
    return ResponseModel(data=activities)
