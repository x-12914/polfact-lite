from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.source import Source, SourceCreate, SourceUpdate
from app.schemas.poi import PaginatedResponse
from app.schemas.response import ResponseModel
from app.services import source as source_service
from app.models.source import SourceType

router = APIRouter()

@router.get("/", response_model=ResponseModel[PaginatedResponse[Source]])
def read_sources(db: Session = Depends(deps.get_db), claim_id: Optional[int] = None, skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), type: Optional[SourceType] = None, search: Optional[str] = None) -> Any:
    results, total = source_service.get_sources(db, claim_id=claim_id, skip=skip, limit=limit, type=type, search=search)
    return ResponseModel(data=PaginatedResponse(total=total, limit=limit, offset=skip, results=results))

@router.post("/", response_model=ResponseModel[Source], status_code=status.HTTP_201_CREATED)
def create_source(*, db: Session = Depends(deps.get_db), source_in: SourceCreate, current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    return ResponseModel(data=source_service.create_source(db, obj_in=source_in), message="Source created")

@router.get("/{id}", response_model=ResponseModel[Source])
def read_source(*, db: Session = Depends(deps.get_db), id: int) -> Any:
    source = source_service.get_source(db, id=id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return ResponseModel(data=source)

@router.put("/{id}", response_model=ResponseModel[Source])
def update_source(*, db: Session = Depends(deps.get_db), id: int, source_in: SourceUpdate, current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    source = source_service.get_source(db, id=id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return ResponseModel(data=source_service.update_source(db, db_obj=source, obj_in=source_in), message="Source updated")

@router.delete("/{id}", response_model=ResponseModel[Source])
def delete_source(*, db: Session = Depends(deps.get_db), id: int, current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    source = source_service.get_source(db, id=id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return ResponseModel(data=source_service.delete_source(db, id=id), message="Source deleted")
