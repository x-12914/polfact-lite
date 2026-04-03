from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.media import MediaType

class MediaBase(BaseModel):
    claim_id: Optional[int] = None
    file_url: str
    type: MediaType
    transcription_text: Optional[str] = None
    transcription_status: Optional[str] = "completed"

class MediaCreate(MediaBase):
    pass

class MediaUpdate(MediaBase):
    claim_id: Optional[int] = None
    file_url: Optional[str] = None
    type: Optional[MediaType] = None

class MediaInDBBase(MediaBase):
    id: int
    is_deleted: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Media(MediaInDBBase):
    pass
