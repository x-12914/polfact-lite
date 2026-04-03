from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class EvidenceType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    TEXT = "text"
    DOCUMENT = "document"

class EvidenceStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    REJECTED = "rejected"

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(EvidenceType), nullable=False)
    file_url = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(EvidenceStatus), default=EvidenceStatus.PENDING)
    confidence = Column(Float, default=0.0)
    ai_insight = Column(String, nullable=True)
    review_notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    claim = relationship("Claim", back_populates="evidence_submissions")
    user = relationship("User")
