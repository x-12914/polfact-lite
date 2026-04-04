from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.claim import Claim, ClaimCreate, ClaimUpdate
from app.schemas.poi import PaginatedResponse
from app.schemas.response import ResponseModel
from app.services import claim as claim_service
from app.models.claim import ClaimStatus

router = APIRouter()

@router.get("/", response_model=ResponseModel[PaginatedResponse[Claim]])
def read_claims(db: Session = Depends(deps.get_db), poi_id: Optional[int] = None, skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), status: Optional[ClaimStatus] = None, search: Optional[str] = None) -> Any:
    results, total = claim_service.get_claims(db, poi_id=poi_id, skip=skip, limit=limit, status=status, search=search)
    return ResponseModel(data=PaginatedResponse(total=total, limit=limit, offset=skip, results=results))

@router.post("/", response_model=ResponseModel[Claim], status_code=status.HTTP_201_CREATED)
def create_claim(*, db: Session = Depends(deps.get_db), claim_in: ClaimCreate, current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    claim = claim_service.create_claim(db, obj_in=claim_in)
    return ResponseModel(data=claim, message="Claim created successfully")

@router.get("/{id}", response_model=ResponseModel[Claim])
def read_claim(*, db: Session = Depends(deps.get_db), id: int) -> Any:
    claim = claim_service.get_claim(db, id=id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return ResponseModel(data=claim)

@router.put("/{id}", response_model=ResponseModel[Claim])
def update_claim(*, db: Session = Depends(deps.get_db), id: int, claim_in: ClaimUpdate, current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    claim = claim_service.get_claim(db, id=id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return ResponseModel(data=claim_service.update_claim(db, db_obj=claim, obj_in=claim_in), message="Claim updated")

@router.delete("/{id}", response_model=ResponseModel[Claim])
def delete_claim(*, db: Session = Depends(deps.get_db), id: int, current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    claim = claim_service.get_claim(db, id=id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return ResponseModel(data=claim_service.delete_claim(db, id=id), message="Claim deleted")

@router.post("/{id}/analyze", response_model=ResponseModel[Claim])
def analyze_claim(*, db: Session = Depends(deps.get_db), id: int, current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    claim = claim_service.analyze_claim(db, id=id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return ResponseModel(data=claim, message="Analysis complete")
    
@router.delete("/{id}/clear-evidence", response_model=ResponseModel[Claim])
def clear_claim_evidence(*, db: Session = Depends(deps.get_db), id: int, current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    claim = claim_service.clear_claim_evidence(db, id=id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return ResponseModel(data=claim, message="All evidence cleared")
