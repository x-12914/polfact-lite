from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class MonitoredSite(Base):
    __tablename__ = "monitored_sites"

    id = Column(Integer, primary_key=True, index=True)
    site_name = Column(String, nullable=False)
    site_url = Column(String, unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    last_scraped = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    articles = relationship("MonitoredArticle", back_populates="site", cascade="all, delete-orphan")

class MonitoredArticle(Base):
    __tablename__ = "monitored_articles"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("monitored_sites.id", ondelete="CASCADE"), nullable=False)
    url = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=True)
    extracted_claims = Column(JSON, default=list)  # List of dicts: [{"text": "...", "quote": "...", "status": "...", "confidence": 0.0, "ai_insight": "..."}]
    last_checked = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    site = relationship("MonitoredSite", back_populates="articles")
