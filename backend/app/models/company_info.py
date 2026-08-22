from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, Text
from app.core.database import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    date = Column(String(50), nullable=False)
    tag = Column(String(50), nullable=False, default="Notice")
    tag_color = Column(String(100), nullable=False, default="bg-blue-50 text-[#0052FF] border-blue-100")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    date = Column(Date, nullable=False)
    type = Column(String(50), nullable=False, default="Gazetted")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
