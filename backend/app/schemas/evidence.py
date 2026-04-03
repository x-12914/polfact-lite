from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.evidence import EvidenceType, EvidenceStatus

class EvidenceBase(BaseModel):
    description: Optional[str] = None
    type: EvidenceType

class EvidenceCreate(EvidenceBase):
    claim_id: int

class EvidenceUpdate(BaseModel):
    status: Optional[EvidenceStatus] = None
    review_notes: Optional[str] = None

class EvidenceResponse(BaseModel):
    id: int
    claim_id: int
    uploaded_by: int
    type: EvidenceType
    file_url: str
    description: Optional[str]
    status: EvidenceStatus
    review_notes: Optional[str]
    created_at: datetime
    reviewed_at: Optional[datetime]
    confidence: Optional[float] = None
    ai_insight: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class EvidenceWithUploader(EvidenceResponse):
    uploader_name: Optional[str] = None
    uploader_email: Optional[str] = None
