from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class SourceType(str, enum.Enum):
    MANIFESTO = "manifesto"
    INTERVIEW = "interview"
    OSINT = "osint"
    MEDIA = "media"
    MANUAL = "manual"

class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(SourceType), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=True)
    link = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), nullable=True)
    credibility_score = Column(Float, default=0.5)
    tags = Column(JSON, default=list)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    claim = relationship("Claim", back_populates="sources")
