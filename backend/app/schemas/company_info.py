from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

# Announcement Schemas
class AnnouncementBase(BaseModel):
    title: str
    summary: str
    date: str
    tag: str = "Notice"
    tag_color: str = "bg-blue-50 text-[#0052FF] border-blue-100"

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Holiday Schemas
class HolidayBase(BaseModel):
    name: str
    date: date
    type: str = "Gazetted"

class HolidayCreate(HolidayBase):
    pass

class HolidayResponse(HolidayBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# System Setting Schemas
class MailSettingsUpdate(BaseModel):
    smtp_email: str
    smtp_password: str

