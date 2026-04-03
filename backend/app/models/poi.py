from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class POIStatus(str, enum.Enum):
    ONGOING = "ongoing"
    COMPLETED = "completed"

class POI(Base):
    __tablename__ = "pois"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    location = Column(String, nullable=True)
    status = Column(Enum(POIStatus), default=POIStatus.ONGOING)
    profile_image = Column(String, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    claims = relationship("Claim", back_populates="poi", cascade="all, delete-orphan")
