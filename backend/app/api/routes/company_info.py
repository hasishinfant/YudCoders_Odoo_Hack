from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.company_info import Announcement, Holiday
from app.models.user import User
from app.schemas.company_info import (
    AnnouncementCreate, AnnouncementResponse,
    HolidayCreate, HolidayResponse
)
from app.api import deps

router = APIRouter()

# Announcements
@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)):
    return db.query(Announcement).order_by(Announcement.id.desc()).all()

@router.post("/announcements", response_model=AnnouncementResponse)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(deps.require_admin)
):
    ann = Announcement(
        title=payload.title,
        summary=payload.summary,
        date=payload.date,
        tag=payload.tag,
        tag_color=payload.tag_color
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann

@router.delete("/announcements/{ann_id}", response_model=dict)
def delete_announcement(
    ann_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(deps.require_admin)
):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(ann)
    db.commit()
    return {"success": True, "message": "Announcement deleted successfully"}

# Holidays
@router.get("/holidays", response_model=List[HolidayResponse])
def get_holidays(db: Session = Depends(get_db)):
    return db.query(Holiday).order_by(Holiday.date.asc()).all()

@router.post("/holidays", response_model=HolidayResponse)
def create_holiday(
    payload: HolidayCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(deps.require_admin)
):
    # Check if duplicate date
    existing = db.query(Holiday).filter(Holiday.date == payload.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="A holiday on this date already exists.")
        
    hol = Holiday(
        name=payload.name,
        date=payload.date,
        type=payload.type
    )
    db.add(hol)
    db.commit()
    db.refresh(hol)
    return hol

@router.delete("/holidays/{hol_id}", response_model=dict)
def delete_holiday(
    hol_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(deps.require_admin)
):
    hol = db.query(Holiday).filter(Holiday.id == hol_id).first()
    if not hol:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(hol)
    db.commit()
    return {"success": True, "message": "Holiday deleted successfully"}
