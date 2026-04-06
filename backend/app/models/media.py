from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class MediaType(str, enum.Enum):
    IMAGE = "image"
    PDF = "pdf"
    VIDEO = "video"
    AUDIO = "audio"

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id", ondelete="CASCADE"), nullable=True)
    file_url = Column(String, nullable=False)
    type = Column(Enum(MediaType), nullable=False)
    transcription_text = Column(String, nullable=True)
    transcription_status = Column(String, nullable=True, default="completed")
    deepfake_status = Column(String, nullable=True)
    deepfake_confidence = Column(Float, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    claim = relationship("Claim", back_populates="media")
