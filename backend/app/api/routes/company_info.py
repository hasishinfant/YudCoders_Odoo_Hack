from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.company_info import Announcement, Holiday
from app.models.system_settings import SystemSetting
from app.models.user import User, RoleEnum
from app.schemas.company_info import (
    AnnouncementCreate, AnnouncementResponse,
    HolidayCreate, HolidayResponse, MailSettingsUpdate
)
from app.core.mail import send_email
from app.api import deps

router = APIRouter()

# Announcements
@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)):
    return db.query(Announcement).order_by(Announcement.id.desc()).all()

@router.post("/announcements", response_model=AnnouncementResponse)
def create_announcement(
    payload: AnnouncementCreate,
    background_tasks: BackgroundTasks,
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
    
    # Send email notification to all active employees
    try:
        active_users = db.query(User).filter(User.active == True).all()
        for u in active_users:
            if u.email:
                subject = f"[Announcement] {payload.title}"
                html_body = f"""
                <html>
                  <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fff;">
                      <div style="background-color: #0052FF; color: #fff; padding: 15px 20px; border-radius: 8px 8px 0 0; font-weight: bold; font-size: 16px;">
                        Dayflow Hub - New Announcement
                      </div>
                      <div style="padding: 20px 0;">
                        <h2 style="margin-top: 0; color: #1e293b;">{payload.title}</h2>
                        <span style="display: inline-block; padding: 4px 8px; background-color: #f1f5f9; border-radius: 6px; font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 15px;">
                          Tag: {payload.tag}
                        </span>
                        <p style="font-size: 14px; color: #475569;">{payload.summary}</p>
                      </div>
                      <div style="border-t: 1px solid #f1f5f9; padding-top: 15px; font-size: 11px; color: #94a3b8; text-align: center;">
                        This is an automated notification from your Dayflow HR Portal.
                      </div>
                    </div>
                  </body>
                </html>
                """
                background_tasks.add_task(send_email, u.email, subject, html_body)
    except Exception as e:
        print(f"Error queueing announcement emails: {e}")
        
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

# System Settings for Mail
@router.get("/settings/mail")
def get_mail_settings(
    db: Session = Depends(get_db),
    admin_user: User = Depends(deps.require_admin)
):
    email_setting = db.query(SystemSetting).filter(SystemSetting.key == "smtp_email").first()
    password_setting = db.query(SystemSetting).filter(SystemSetting.key == "smtp_password").first()
    
    email = email_setting.value if email_setting else "flipclip0008@gmail.com"
    password = password_setting.value if password_setting else "cscoohorrehfjcqe"
    
    # Clean up password whitespace
    if password:
        password = "".join(password.split())
        
    return {
        "success": True,
        "data": {
            "smtp_email": email,
            "smtp_password": password
        }
    }

@router.post("/settings/mail")
def update_mail_settings(
    payload: MailSettingsUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(deps.require_admin)
):
    # Save/update email
    email_setting = db.query(SystemSetting).filter(SystemSetting.key == "smtp_email").first()
    if not email_setting:
        email_setting = SystemSetting(key="smtp_email", value=payload.smtp_email)
        db.add(email_setting)
    else:
        email_setting.value = payload.smtp_email
        
    # Save/update password
    password_setting = db.query(SystemSetting).filter(SystemSetting.key == "smtp_password").first()
    if not password_setting:
        password_setting = SystemSetting(key="smtp_password", value=payload.smtp_password)
        db.add(password_setting)
    else:
        password_setting.value = payload.smtp_password
        
    db.commit()
    return {"success": True, "message": "SMTP settings updated successfully"}

