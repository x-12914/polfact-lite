from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from app.models.claim import ClaimStatus
from app.schemas.source import Source
from app.schemas.media import Media
from app.schemas.poi import POI

class ClaimBase(BaseModel):
    poi_id: int
    description: str = Field(..., min_length=10, max_length=1000)
    status: ClaimStatus = ClaimStatus.ONGOING
    confidence: float = Field(default=0.0, ge=0, le=100)
    date_reported: Optional[datetime] = None

class ClaimCreate(ClaimBase):
    pass

class ClaimUpdate(ClaimBase):
    poi_id: Optional[int] = None
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    status: Optional[ClaimStatus] = None
    confidence: Optional[float] = Field(None, ge=0, le=100)

class ClaimInDBBase(ClaimBase):
    id: int
    is_deleted: bool
    created_at: datetime
    ai_insight: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class Claim(ClaimInDBBase):
    media: List[Media] = []
    sources: List[Source] = []
    poi: Optional[POI] = None

class ClaimFull(Claim):
    pass

class ClaimCreateFromUrl(BaseModel):
    poi_id: int
    url: str

Claim.model_rebuild()
ClaimFull.model_rebuild()
