from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.source import Source, SourceType
from app.schemas.source import SourceCreate, SourceUpdate

def create_source(db: Session, *, obj_in: SourceCreate) -> Source:
    db_obj = Source(
        claim_id=obj_in.claim_id,
        type=obj_in.type,
        title=obj_in.title,
        content=obj_in.content,
        link=obj_in.link,
        date=obj_in.date,
        credibility_score=obj_in.credibility_score,
        tags=obj_in.tags,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_source(db: Session, id: int) -> Optional[Source]:
    return db.query(Source).filter(Source.id == id, Source.is_deleted == False).first()

def get_sources(db: Session, *, claim_id: Optional[int] = None, skip: int = 0, limit: int = 10, type: Optional[SourceType] = None, search: Optional[str] = None) -> Tuple[List[Source], int]:
    query = db.query(Source).filter(Source.is_deleted == False)
    if claim_id:
        query = query.filter(Source.claim_id == claim_id)
    if type:
        query = query.filter(Source.type == type)
    if search:
        query = query.filter(Source.title.ilike(f"%{search}%"))
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    return results, total

def update_source(db: Session, *, db_obj: Source, obj_in: SourceUpdate) -> Source:
    if obj_in.claim_id is not None: db_obj.claim_id = obj_in.claim_id
    if obj_in.type is not None: db_obj.type = obj_in.type
    if obj_in.title is not None: db_obj.title = obj_in.title
    if obj_in.link is not None: db_obj.link = obj_in.link
    if obj_in.date is not None: db_obj.date = obj_in.date
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_source(db: Session, *, id: int) -> Optional[Source]:
    db_obj = db.query(Source).filter(Source.id == id).first()
    if db_obj:
        db_obj.is_deleted = True
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
    return db_obj
