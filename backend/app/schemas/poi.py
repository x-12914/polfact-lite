from typing import Optional, List, Generic, TypeVar
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from app.models.poi import POIStatus
from app.schemas.claim import ClaimFull

T = TypeVar("T")

class POIBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    location: Optional[str] = None
    status: POIStatus = POIStatus.ONGOING
    profile_image: Optional[str] = None

class POICreate(POIBase):
    pass

class POIUpdate(POIBase):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[POIStatus] = None

class POIInDBBase(POIBase):
    id: int
    is_deleted: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class POI(POIInDBBase):
    pass

class PaginatedResponse(BaseModel, Generic[T]):
    total: int
    limit: int
    offset: int
    results: List[T]

class POIStats(BaseModel):
    fulfilled: int
    partial: int
    unfulfilled: int
    ongoing: int

class POIFull(POI):
    stats: POIStats
    claims: List[ClaimFull] = []

POIFull.model_rebuild()
