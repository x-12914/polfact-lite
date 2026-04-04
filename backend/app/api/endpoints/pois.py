from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.poi import POI, POICreate, POIUpdate, POIFull, PaginatedResponse
from app.schemas.response import ResponseModel
from app.services import poi as poi_service
from app.services import claim as claim_service

router = APIRouter()

@router.get("/", response_model=ResponseModel[PaginatedResponse[POI]])
def read_pois(db: Session = Depends(deps.get_db), skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), search: Optional[str] = None) -> Any:
    results, total = poi_service.get_pois(db, skip=skip, limit=limit, search=search)
    # Populate stats for each POI for the list view components
    for p in results:
        p.stats = poi_service.get_poi_stats(db, poi_id=p.id)
    return ResponseModel(data=PaginatedResponse(total=total, limit=limit, offset=skip, results=results))

@router.post("/", response_model=ResponseModel[POI], status_code=status.HTTP_201_CREATED)
def create_poi(*, db: Session = Depends(deps.get_db), poi_in: POICreate, current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    poi = poi_service.create_poi(db, obj_in=poi_in)
    return ResponseModel(data=poi, message="POI created successfully")

@router.get("/{id}/full", response_model=ResponseModel[POIFull])
def read_poi_full(*, db: Session = Depends(deps.get_db), id: int) -> Any:
    from app.models.poi import POI as POIModel
    poi = db.query(POIModel).filter(POIModel.id == id, POIModel.is_deleted == False).first()
    if not poi:
        raise HTTPException(status_code=404, detail="POI not found")
    stats = poi_service.get_poi_stats(db, poi_id=id)
    claims, _ = claim_service.get_claims(db, poi_id=id, limit=100)
    data = {**poi.__dict__, "stats": stats, "claims": claims}
    return ResponseModel(data=data)

@router.get("/{id}", response_model=ResponseModel[POI])
def read_poi(*, db: Session = Depends(deps.get_db), id: int) -> Any:
    poi = poi_service.get_poi(db, id=id)
    if not poi:
        raise HTTPException(status_code=404, detail="POI not found")
    return ResponseModel(data=poi)

@router.put("/{id}", response_model=ResponseModel[POI])
def update_poi(*, db: Session = Depends(deps.get_db), id: int, poi_in: POIUpdate, current_user: deps.User = Depends(deps.get_current_admin)) -> Any:
    poi = poi_service.get_poi(db, id=id)
    if not poi:
        raise HTTPException(status_code=404, detail="POI not found")
    return ResponseModel(data=poi_service.update_poi(db, db_obj=poi, obj_in=poi_in), message="POI updated")

@router.post("/{id}/image", response_model=ResponseModel[POI])
async def upload_poi_image(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    file: UploadFile = File(...),
    current_user: deps.User = Depends(deps.get_current_admin),
) -> Any:
    poi = poi_service.get_poi(db, id=id)
    if not poi:
        raise HTTPException(status_code=404, detail="POI not found")
    
    import os
    import uuid
    from app.core.config import settings
    
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename)[1].lower()
    filename = f"poi_{id}_{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    poi.profile_image = f"/{upload_dir}/{filename}"
    db.add(poi)
    db.commit()
    db.refresh(poi)
    return ResponseModel(data=poi, message="Profile image updated")
