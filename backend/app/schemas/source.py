from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from app.models.source import SourceType

class SourceBase(BaseModel):
    claim_id: int
    type: SourceType
    title: str = Field(..., min_length=2, max_length=200)
    content: Optional[str] = None
    link: Optional[str] = None
    date: Optional[datetime] = None
    credibility_score: float = Field(default=0.5, ge=0.0, le=1.0)
    tags: List[str] = Field(default_factory=list)

class SourceCreate(SourceBase):
    pass

class SourceUpdate(SourceBase):
    claim_id: Optional[int] = None
    type: Optional[SourceType] = None
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    credibility_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    tags: Optional[List[str]] = None

class SourceInDBBase(SourceBase):
    id: int
    is_deleted: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Source(SourceInDBBase):
    pass
