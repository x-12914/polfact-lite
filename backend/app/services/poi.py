from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.poi import POI, POIStatus
from app.models.claim import Claim, ClaimStatus
from app.schemas.poi import POICreate, POIUpdate, POIStats

def create_poi(db: Session, *, obj_in: POICreate) -> POI:
    db_obj = POI(
        name=obj_in.name,
        description=obj_in.description,
        location=obj_in.location,
        status=obj_in.status,
        profile_image=obj_in.profile_image
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_poi(db: Session, id: int) -> Optional[POI]:
    return db.query(POI).filter(POI.id == id, POI.is_deleted == False).first()

def get_pois(db: Session, *, skip: int = 0, limit: int = 10, status: Optional[POIStatus] = None, search: Optional[str] = None) -> Tuple[List[POI], int]:
    query = db.query(POI).filter(POI.is_deleted == False)
    if status:
        query = query.filter(POI.status == status)
    if search:
        query = query.filter(POI.name.ilike(f"%{search}%"))
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    return results, total

def update_poi(db: Session, *, db_obj: POI, obj_in: POIUpdate) -> POI:
    if obj_in.name is not None: db_obj.name = obj_in.name
    if obj_in.description is not None: db_obj.description = obj_in.description
    if obj_in.location is not None: db_obj.location = obj_in.location
    if obj_in.status is not None: db_obj.status = obj_in.status
    if obj_in.profile_image is not None: db_obj.profile_image = obj_in.profile_image
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_poi(db: Session, *, id: int) -> Optional[POI]:
    db_obj = db.query(POI).filter(POI.id == id).first()
    if db_obj:
        db_obj.is_deleted = True
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
    return db_obj

def get_poi_stats(db: Session, poi_id: int) -> POIStats:
    claims = db.query(Claim).filter(Claim.poi_id == poi_id, Claim.is_deleted == False).all()
    stats = {
        "fulfilled": sum(1 for c in claims if c.status == ClaimStatus.FULFILLED),
        "partial": sum(1 for c in claims if c.status == ClaimStatus.PARTIAL),
        "unfulfilled": sum(1 for c in claims if c.status == ClaimStatus.UNFULFILLED),
        "ongoing": sum(1 for c in claims if c.status == ClaimStatus.ONGOING),
    }
    return POIStats(**stats)
