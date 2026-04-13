from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.media import Media, MediaType
from app.schemas.media import MediaCreate, MediaUpdate

def create_media(db: Session, *, obj_in: MediaCreate) -> Media:
    db_obj = Media(
        claim_id=obj_in.claim_id,
        file_url=obj_in.file_url,
        type=obj_in.type,
        transcription_status=obj_in.transcription_status,
        transcription_text=obj_in.transcription_text,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_media(db: Session, id: int) -> Optional[Media]:
    return db.query(Media).filter(Media.id == id, Media.is_deleted == False).first()

def get_all_media(db: Session, *, claim_id: Optional[int] = None, skip: int = 0, limit: int = 10, type: Optional[MediaType] = None) -> Tuple[List[Media], int]:
    query = db.query(Media).filter(Media.is_deleted == False)
    if claim_id:
        query = query.filter(Media.claim_id == claim_id)
    if type:
        query = query.filter(Media.type == type)
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    return results, total

def delete_media(db: Session, *, id: int) -> Optional[Media]:
    db_obj = db.query(Media).filter(Media.id == id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj
