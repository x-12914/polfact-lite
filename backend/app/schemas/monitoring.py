from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Any, Optional
from datetime import datetime

class MonitoredSiteCreate(BaseModel):
    name: str
    url: str

class MonitoredSiteOut(BaseModel):
    id: int
    site_name: str
    site_url: str
    is_active: bool
    last_scraped: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MonitoredArticleOut(BaseModel):
    id: int
    site_id: int
    url: str
    title: str
    extracted_claims: List[Dict[str, Any]]
    last_checked: datetime
    created_at: datetime

    class Config:
        from_attributes = True
