from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class ClaimStatus(str, enum.Enum):
    FULFILLED = "fulfilled"
    PARTIAL = "partial"
    UNFULFILLED = "unfulfilled"
    ONGOING = "ongoing"
    VERIFIED = "verified"
    PENDING_REVIEW = "pending_review"

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    poi_id = Column(Integer, ForeignKey("pois.id", ondelete="CASCADE"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(String, nullable=False)
    status = Column(Enum(ClaimStatus), default=ClaimStatus.ONGOING)
    confidence = Column(Float, default=0.0)
    ai_insight = Column(String, nullable=True)
    date_reported = Column(DateTime(timezone=True), nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    poi = relationship("POI", back_populates="claims")
    sources = relationship("Source", back_populates="claim", cascade="all, delete-orphan")
    media = relationship("Media", back_populates="claim", cascade="all, delete-orphan")
    evidence_submissions = relationship("Evidence", back_populates="claim", cascade="all, delete-orphan")
    assigned_journalist = relationship("User", foreign_keys=[assigned_to])
